import { Router, Response } from 'express';
import { ProctoringLog } from '../models/ProctoringLog.js';
import { StudentExperience } from '../models/StudentExperience.js';
import { validateProctoringEvent, validateExperienceSync } from '../../../shared/middleware/validation.js';
import { proctoringRateLimiter, experienceRateLimiter } from '../../../shared/middleware/rateLimit.js';
import { authenticateUser, AuthenticatedRequest } from '../../../shared/middleware/auth.js';
import { logger } from '../../../shared/lib/logger.js';

const router = Router();

router.post('/proctor/ingest',
    proctoringRateLimiter,
    validateProctoringEvent,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { studentId, courseId, attemptId, eventType, details } = req.body;

            if (!studentId) {
                return res.status(400).json({ error: 'Missing studentId' });
            }

            // Sanitize inputs
            const sanitizedDetails = details && typeof details === 'object'
                ? JSON.parse(JSON.stringify(details)) // Deep clone to prevent prototype pollution
                : {};

            const log = new ProctoringLog({
                studentId: String(studentId).trim().substring(0, 200),
                courseId: String(courseId).trim().substring(0, 200),
                attemptId: String(attemptId).trim().substring(0, 200),
                eventType,
                details: sanitizedDetails,
                timestamp: new Date()
            });

            await log.save();
            res.status(202).json({ success: true }); // 202 Accepted
        } catch (error) {
            logger.error('Proctoring Ingestion Error', error instanceof Error ? error : new Error(String(error)), {
                studentId: req.body.studentId,
                eventType: req.body.eventType
            });
            res.status(500).json({ error: 'Failed to ingest log' });
        }
    }
);

// Update student experience (periodic heartbeat)
// Note: authenticateUser removed for sendBeacon compatibility
router.post('/experience/sync',
    experienceRateLimiter,
    validateExperienceSync,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { studentId, courseId, moduleStats, aiInteraction } = req.body;

            if (!studentId) {
                return res.status(400).json({ error: 'Missing studentId' });
            }

            const now = new Date();
            let sanitizedInteraction = null;

            if (aiInteraction && typeof aiInteraction === 'object' && !Array.isArray(aiInteraction)) {
                sanitizedInteraction = {
                    query: String(aiInteraction.query || '').substring(0, 1000),
                    responseSnippet: String(aiInteraction.responseSnippet || '').substring(0, 1000),
                    timestamp: now
                };
            }

            if (moduleStats) {
                const moduleId = String(moduleStats.moduleId).trim();
                const interactions = moduleStats.interactions || 0;
                const timeSpent = Math.max(0, moduleStats.timeSpent || 0);
                const scrollDepth = Math.max(0, Math.min(100, moduleStats.scrollDepth || 0));

                // 1. Try to update an existing module entry using atomic operators
                // This prevents race conditions where parallel requests overwrite each other's data
                const updated = await StudentExperience.findOneAndUpdate(
                    {
                        studentId,
                        courseId,
                        "moduleStats.moduleId": moduleId
                    },
                    {
                        $inc: {
                            "moduleStats.$.timeSpent": timeSpent,
                            "moduleStats.$.interactions": interactions,
                            totalTimeSpent: timeSpent
                        },
                        $max: { "moduleStats.$.scrollDepth": scrollDepth },
                        $set: {
                            "moduleStats.$.lastAccessed": now,
                            updatedAt: now
                        },
                        // If we have an AI interaction, we can push it in the same atomic op
                        ...(sanitizedInteraction ? { $push: { aiInteractions: sanitizedInteraction } } : {})
                    }
                );

                // 2. If no document was found or the module wasn't in the array, perform an upsert/push
                if (!updated) {
                    const newModuleStat = {
                        moduleId,
                        timeSpent,
                        scrollDepth,
                        interactions,
                        lastAccessed: now
                    };

                    await StudentExperience.findOneAndUpdate(
                        { studentId, courseId },
                        {
                            $push: {
                                moduleStats: newModuleStat,
                                ...(sanitizedInteraction ? { aiInteractions: sanitizedInteraction } : {})
                            },
                            $inc: { totalTimeSpent: timeSpent },
                            $set: { updatedAt: now }
                        },
                        { upsert: true }
                    );
                }
            } else if (sanitizedInteraction) {
                // Case: Only AI interaction, no module stats update
                await StudentExperience.findOneAndUpdate(
                    { studentId, courseId },
                    {
                        $push: { aiInteractions: sanitizedInteraction },
                        $set: { updatedAt: now },
                        $setOnInsert: { moduleStats: [], totalTimeSpent: 0 }
                    },
                    { upsert: true }
                );
            }

            res.json({ success: true });
        } catch (error) {
            logger.error('Experience Sync Error', error instanceof Error ? error : new Error(String(error)), {
                studentId: req.user?.id,
                courseId: req.body.courseId
            });
            res.status(500).json({ error: 'Failed to sync experience' });
        }
    }
);

export default router;
