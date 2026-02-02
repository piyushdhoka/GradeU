import { create } from 'zustand';
import { courseService } from '../services/courseService';
import type { Module, Course } from '../types/types';

interface ProgressRow {
    module_id?: string;
    completed?: boolean | null;
    quiz_score?: number | null;
    completedTopics?: string[];
}

interface CourseState {
    course: Course | null;
    modules: Module[];
    loading: boolean;
    error: string | null;

    // Actions
    setCourse: (course: Course | null) => void;
    fetchCourseProgress: (courseId: string, userId?: string) => Promise<void>;
    updateModuleLocal: (moduleId: string, updates: Partial<Module>) => void;
    completeModule: (userId: string, courseId: string, moduleId: string, score?: number, topics?: string[]) => Promise<void>;
    reset: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
    course: null,
    modules: [],
    loading: false,
    error: null,

    setCourse: (course) => set({ course, modules: course?.modules || [] }),

    fetchCourseProgress: async (courseId, userId) => {
        set({ loading: true, error: null });
        try {
            const data = await courseService.getCourseById(courseId);
            if (!data) {
                set({ error: 'Course not found', loading: false });
                return;
            }

            let normalizedModules = data.course_modules ?? data.modules ?? [];

            if (userId) {
                // Fetch comprehensive progress (MongoDB + Supabase) from backend for this course
                const progress = await courseService.getCourseProgress(courseId) as ProgressRow[] | null;
                const moduleProgress = (progress || []).reduce((acc: Record<string, ProgressRow>, p: ProgressRow) => {
                    if (p.module_id) acc[p.module_id] = p;
                    return acc;
                }, {});

                normalizedModules = (data.modules || []).map((m: Module) => {
                    const prog = moduleProgress[m.id];
                    return {
                        ...m,
                        completed: !!prog?.completed,
                        testScore: (prog?.quiz_score ?? m.testScore) ?? undefined,
                        completedTopics: prog?.completedTopics || []
                    };
                });
            } else {
                normalizedModules = data.modules || [];
            }

            set({
                course: { ...data, modules: normalizedModules },
                modules: normalizedModules,
                loading: false
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    updateModuleLocal: (moduleId, updates) => {
        const { modules, course } = get();
        const newModules = modules.map(m => m.id === moduleId ? { ...m, ...updates } : m);
        set({
            modules: newModules,
            course: course ? { ...course, modules: newModules } : null
        });
    },

    completeModule: async (userId, courseId, moduleId, score, topics) => {
        // 1. Update locally first for instant UI feedback
        get().updateModuleLocal(moduleId, {
            completed: true,
            testScore: score,
            completedTopics: topics
        });

        // 2. Sync with backend
        try {
            await courseService.updateProgress(userId, moduleId, true, score, courseId, topics);
        } catch (err) {
            console.error('Failed to sync progress to backend:', err);
            // Optional: rollback on failure? Usually better to just retry or leave it for next fetch.
        }
    },

    reset: () => set({ course: null, modules: [], loading: false, error: null })
}));
