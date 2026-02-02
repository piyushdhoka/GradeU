import { StudentProgress } from '../models/StudentProgress.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export interface ProgressData {
    moduleId: string;
    completed: boolean;
    quizScore?: number;
    completedTopics?: string[]; // Granular topic completion
    completedAt?: Date;
    updatedAt?: Date;
}

/**
 * Unified progress service that reads from both MongoDB and Supabase
 * MongoDB is the primary source for AI-generated courses (ObjectId modules)
 * Supabase is the primary source for manually created courses (UUID modules)
 */
export class ProgressService {
    /**
     * Get progress for a specific module
     * Checks MongoDB first (for ObjectId modules), then Supabase (for UUID modules)
     */
    static async getModuleProgress(
        studentId: string,
        studentEmail: string,
        moduleId: string,
        courseId: string
    ): Promise<ProgressData | null> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);

        // For MongoDB ObjectId modules, check MongoDB first
        if (!isUUID) {
            try {
                const progress = await StudentProgress.findOne({
                    studentEmail,
                    courseId,
                    moduleId
                });

                if (progress) {
                    return {
                        moduleId: progress.moduleId,
                        completed: progress.completed,
                        quizScore: progress.quizScore || undefined,
                        completedTopics: progress.completedTopics || [],
                        completedAt: progress.updatedAt,
                        updatedAt: progress.updatedAt
                    };
                }
            } catch (error) {
                logger.error('Error fetching MongoDB progress', error instanceof Error ? error : new Error(String(error)));
            }
        }

        // For UUID modules, check Supabase
        if (isUUID) {
            try {
                const { data: results, error } = await supabase
                    .from('module_progress')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('module_id', moduleId)
                    .limit(1);

                const data = results?.[0];

                if (error && error.code !== 'PGRST116') { // PGRST116 is "not found", which is OK
                    logger.error('Error fetching Supabase progress', error);
                    return null;
                }

                if (data) {
                    return {
                        moduleId: data.module_id,
                        completed: data.completed,
                        quizScore: data.quiz_score || undefined,
                        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
                        updatedAt: data.completed_at ? new Date(data.completed_at) : undefined
                    };
                }
            } catch (error) {
                logger.error('Error fetching Supabase progress', error instanceof Error ? error : new Error(String(error)));
            }
        }

        return null;
    }

    /**
     * Get all progress for a course
     * Combines data from both MongoDB and Supabase
     */
    static async getCourseProgress(
        studentId: string,
        studentEmail: string,
        courseId: string
    ): Promise<Map<string, ProgressData>> {
        const progressMap = new Map<string, ProgressData>();

        // Fetch from MongoDB
        try {
            const mongoProgress = await StudentProgress.find({
                studentEmail,
                courseId
            });

            mongoProgress.forEach(progress => {
                progressMap.set(progress.moduleId, {
                    moduleId: progress.moduleId,
                    completed: progress.completed,
                    quizScore: progress.quizScore || undefined,
                    completedTopics: progress.completedTopics || [],
                    completedAt: progress.updatedAt,
                    updatedAt: progress.updatedAt
                });
            });
        } catch (error) {
            logger.error('Error fetching MongoDB course progress', error instanceof Error ? error : new Error(String(error)));
        }

        // Fetch from Supabase (will overwrite MongoDB entries if same moduleId exists in both)
        try {
            const { data, error } = await supabase
                .from('module_progress')
                .select('*')
                .eq('student_id', studentId);

            if (!error && data) {
                data.forEach(progress => {
                    // Only include if it's for this course (check if module belongs to course)
                    // For now, we'll include all and let the caller filter if needed
                    progressMap.set(progress.module_id, {
                        moduleId: progress.module_id,
                        completed: progress.completed,
                        quizScore: progress.quiz_score || undefined,
                        completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
                        updatedAt: progress.completed_at ? new Date(progress.completed_at) : undefined
                    });
                });
            }
        } catch (error) {
            logger.error('Error fetching Supabase course progress', error instanceof Error ? error : new Error(String(error)));
        }

        return progressMap;
    }

    /**
     * Update progress in the appropriate storage system
     * MongoDB for ObjectId modules, Supabase for UUID modules
     */
    static async updateProgress(
        studentId: string,
        studentEmail: string,
        moduleId: string,
        courseId: string,
        completed: boolean,
        quizScore?: number,
        completedTopics?: string[]
    ): Promise<void> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);

        // Always update MongoDB (primary storage for all courses)
        try {
            await StudentProgress.findOneAndUpdate(
                {
                    studentEmail,
                    courseId,
                    moduleId
                },
                {
                    completed,
                    quizScore: quizScore !== undefined ? quizScore : null,
                    completedTopics: completedTopics || [],
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            logger.error('Error updating MongoDB progress', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }

        // Also update Supabase for UUID modules
        if (isUUID) {
            try {
                const { data: results } = await supabase
                    .from('module_progress')
                    .select('id')
                    .eq('student_id', studentId)
                    .eq('module_id', moduleId)
                    .limit(1);

                const existingProgress = results?.[0];

                const progressData: any = {
                    student_id: studentId,
                    module_id: moduleId,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                };

                if (quizScore !== undefined) {
                    progressData.quiz_score = quizScore;
                }

                if (existingProgress) {
                    await supabase
                        .from('module_progress')
                        .update(progressData)
                        .eq('id', existingProgress.id);
                } else {
                    await supabase
                        .from('module_progress')
                        .insert([progressData]);
                }
            } catch (error) {
                logger.error('Error updating Supabase progress', error instanceof Error ? error : new Error(String(error)));
                // Don't throw - MongoDB update succeeded, Supabase is secondary
            }
        }
    }
}
