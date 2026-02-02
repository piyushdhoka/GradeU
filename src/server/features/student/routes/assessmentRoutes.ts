import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../../shared/middleware/auth.js';
import { authenticateUser } from '../../../shared/middleware/auth.js';
import { logger } from '../../../shared/lib/logger.js';
import { supabase } from '../../../shared/lib/supabase.js';
import { Course } from '../../../shared/models/Course.js';
import { ProctoringLog } from '../models/ProctoringLog.js';
import { StudentProgress } from '../../../shared/models/StudentProgress.js';

const router = Router();

interface QuizSubmission {
    moduleId: string;
    answers: Record<string, number>; // questionId (or index) -> selectedOptionIndex
    proctoringSessionId?: string;
}

// Helper to check MongoDB for violations
async function countViolations(attemptId: string, studentId: string, courseId: string): Promise<number> {
    if (!attemptId) return 0;
    try {
        // Count violations for this specific attempt
        const violationCount = await ProctoringLog.countDocuments({
            attemptId,
            studentId,
            courseId,
            eventType: {
                $in: ['tab-switch', 'exit-fullscreen', 'window-blur', 'face-missing', 'multiple-faces', 'suspicious-activity']
            }
        });
        return violationCount;
    } catch (error) {
        logger.error('Error counting violations', error instanceof Error ? error : new Error(String(error)));
        return 0;
    }
}

router.post('/submit', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const studentId = req.user?.id;
        const { moduleId, answers, proctoringSessionId } = req.body as QuizSubmission;
        const authClient = req.supabase || supabase;

        if (!studentId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!moduleId || !answers) {
            return res.status(400).json({ error: 'Missing moduleId or answers' });
        }

        // 1. Fetch the Quiz from MONGODB (Correct Source of Truth for frontend IDs)
        // We find the course that matches this module ID inside its modules array
        const course = await Course.findOne({
            "modules._id": new mongoose.Types.ObjectId(moduleId)
        });

        if (!course) {
            logger.error('Course/Module not found in MongoDB', new Error('Module Not Found'), { moduleId });
            return res.status(404).json({ error: 'Module not found' });
        }

        // Extract the specific module
        const module = course.modules.find((m: any) => m._id.toString() === moduleId);

        if (!module || !module.quiz || module.quiz.length === 0) {
            logger.error('Quiz lookup failed', new Error('Quiz Not Found'), { moduleId });
            return res.status(404).json({ error: 'Quiz not found for this module' });
        }

        const quizzes = module.quiz; // Array of { question, options, correctAnswer }

        // 2. Grade the Submission
        let correctCount = 0;
        const details: any[] = [];

        quizzes.forEach((q: any, index: number) => {
            // Frontend might send answer by Question ID (if exists) or Index.
            // Mongo schema uses "correctAnswer" (string usually? output of worker maps it to string?) -> Wait, worker.ts line 135:
            // options: q.options (array of strings)
            // correct_option: q.correctAnswer (string or index?)
            // In mongodb.ts line 36: correctAnswer: { type: String, required: true }

            // NOTE: worker.ts line 139: 'correct_option: q.correctAnswer'.
            // But verify what `answers` keys are. 
            // ModuleViewer.tsx line 239: `answersMap[q.id] = answers[i]`.
            // Mongo questions might NOT have 'id' explicit field? Mongoose adds `_id`.

            const qId = q._id.toString();
            const submittedAnswerIndex = answers[qId]; // Expecting index

            // Check if correctAnswer is stored as String (Text) or Index?
            // `Course-gen` stores it as String usually? 
            // Let's assume it's the ANSWER TEXT for now? Or Index?
            // Actually, `ModuleTest.tsx` returns `answers` which is array of indices.
            // `ModuleViewer.tsx` maps it to `answersMap` using IDs.

            // In Mongo schema (mongodb.ts): `options: [String], correctAnswer: String`.
            // If `correctAnswer` is the text string, we compare `options[submittedAnswerIndex]` with `correctAnswer`.

            if (submittedAnswerIndex === undefined) {
                details.push({ questionId: qId, correct: false, submitted: null });
                return;
            }

            const submittedText = q.options[submittedAnswerIndex];
            // Allow loose equality just in case
            const isCorrect = submittedText === q.correctAnswer || submittedAnswerIndex == q.correctAnswer;

            if (isCorrect) correctCount++;

            details.push({
                questionId: qId,
                correct: isCorrect,
                submitted: submittedAnswerIndex
            });
        });

        const score = Math.round((correctCount / quizzes.length) * 100);
        const passed = score >= 70; // 70% passing threshold

        // 2.5. Validate Proctoring (Server-Side Enforcement)
        const courseId = course._id.toString();
        const isInitialAssessment = module.type === 'initial_assessment';
        let violationCount = 0;
        const MAX_VIOLATIONS = 3; // Maximum allowed violations before rejection

        if (proctoringSessionId) {
            violationCount = await countViolations(proctoringSessionId, studentId, courseId);

            // ONLY enforce proctoring blocks for non-initial assessments
            if (violationCount > MAX_VIOLATIONS && !isInitialAssessment) {
                logger.warn('Quiz submission rejected due to proctoring violations', {
                    studentId,
                    moduleId,
                    violationCount,
                    proctoringSessionId
                });
                return res.status(403).json({
                    error: 'Submission rejected due to proctoring violations',
                    violationCount,
                    maxAllowed: MAX_VIOLATIONS
                });
            }
        }

        // 3. Store Attempt in Postgres (History) - Only for UUID modules
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);

        if (isUUID) {
            await authClient
                .from('quiz_attempts')
                .insert({
                    student_id: studentId,
                    module_id: moduleId,
                    score,
                    passed,
                    answers, // Storing raw answers
                    proctoring_session_id: proctoringSessionId,
                    violation_count: violationCount
                });
        }

        // 4. Update Progress in MongoDB (Primary storage for all courses)
        const studentEmail = req.user?.email || '';

        if (studentEmail && (passed || isInitialAssessment)) {
            try {
                await StudentProgress.findOneAndUpdate(
                    {
                        studentEmail,
                        courseId,
                        moduleId
                    },
                    {
                        completed: true,
                        quizScore: score,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                logger.info('Progress updated in MongoDB', { studentEmail, courseId, moduleId, score });
            } catch (mongoError) {
                logger.error('Failed to update MongoDB progress', mongoError instanceof Error ? mongoError : new Error(String(mongoError)));
                // Don't fail the request, but log the error
            }
        }

        // 5. Update Progress in Supabase (Secondary storage for UUID modules only)
        if ((passed || isInitialAssessment) && isUUID) {
            try {
                const { data: results } = await authClient
                    .from('module_progress')
                    .select('id')
                    .eq('student_id', studentId)
                    .eq('module_id', moduleId)
                    .limit(1);

                const existingProgress = results?.[0];

                if (existingProgress) {
                    await authClient
                        .from('module_progress')
                        .update({
                            completed: true,
                            completed_at: new Date().toISOString()
                        })
                        .eq('id', existingProgress.id);
                } else {
                    await authClient
                        .from('module_progress')
                        .insert({
                            student_id: studentId,
                            module_id: moduleId,
                            completed: true,
                            completed_at: new Date().toISOString()
                        });
                }
            } catch (supabaseError) {
                logger.error('Failed to update Supabase progress', supabaseError instanceof Error ? supabaseError : new Error(String(supabaseError)));
                // Don't fail the request, but log the error
            }
        }

        logger.info('Quiz submitted', { studentId, moduleId, courseId, score, passed, violationCount });

        res.json({
            success: true,
            score,
            passed,
            attemptId: 'mongo-attempt',
            totalQuestions: quizzes.length,
            correctCount
        });

    } catch (error) {
        logger.error('Quiz submission error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Internal server error processing submission' });
    }
});

export default router;
