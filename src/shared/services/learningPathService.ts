import { supabase } from '@lib/supabase';

class LearningPathService {
    async rebalance(userId: string, courseId?: string) {
        // Simple placeholder: maintain consistency for now
        // If courseId is provided, we could filter by it if needed
        const query = supabase
            .from('module_progress')
            .select('module_id, completed')
            .eq('student_id', userId);

        if (courseId) {
            // Future: add course-specific filtering logic here
        }

        const { data, error } = await query.order('completed_at', { ascending: false });

        if (error) {
            console.warn(`Rebalance logic - error fetching progress: ${error.message}`);
            return [];
        }
        return data ?? [];
    }
}

export const learningPathService = new LearningPathService();
