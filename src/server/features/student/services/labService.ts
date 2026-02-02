import { LabCompletion, LabStats } from '../models/labModel.js';
import { logger } from '../../../shared/lib/logger.js';
import { SupabaseClient } from '@supabase/supabase-js';

const LAB_TOTAL = 6;

export async function markLabAsCompleted(
  supabase: SupabaseClient,
  studentId: string,
  labId: string
): Promise<LabCompletion> {
  try {
    // Check if already completed
    const { data: existingData } = await supabase
      .from('lab_completions')
      .select('*')
      .eq('student_id', studentId)
      .eq('lab_id', labId)
      .limit(1);

    const existing = existingData?.[0];

    if (existing) {
      return {
        id: existing.id,
        studentId: existing.student_id,
        labId: existing.lab_id,
        completedAt: existing.completed_at,
        createdAt: existing.created_at,
      };
    }

    // Insert new completion
    const { data: completions, error } = await supabase
      .from('lab_completions')
      .insert({
        student_id: studentId,
        lab_id: labId,
        completed_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    const completion = completions?.[0];

    if (error || !completion) {
      logger.error('Failed to mark lab as completed', error as any, {
        studentId,
        labId
      });
      throw error || new Error('Failed to create completion record');
    }

    return {
      id: completion.id,
      studentId: completion.student_id,
      labId: completion.lab_id,
      completedAt: completion.completed_at,
      createdAt: completion.created_at,
    };
  } catch (error) {
    logger.error('Error in markLabAsCompleted', error instanceof Error ? error : new Error(String(error)), { studentId, labId });
    throw error;
  }
}

export async function getLabStats(supabase: SupabaseClient, studentId: string): Promise<LabStats> {
  try {
    const { data: completions, error } = await supabase
      .from('lab_completions')
      .select('lab_id')
      .eq('student_id', studentId);

    if (error) {
      logger.error('Failed to fetch lab stats', error as any, {
        studentId
      });
      // Return empty stats on error
      return {
        totalLabs: LAB_TOTAL,
        completedLabs: 0,
        completionPercentage: 0,
        completedLabIds: [],
      };
    }

    const completedLabIds = (completions || []).map(c => c.lab_id);
    const completedLabs = completedLabIds.length;
    const completionPercentage = (completedLabs / LAB_TOTAL) * 100;

    return {
      totalLabs: LAB_TOTAL,
      completedLabs,
      completionPercentage,
      completedLabIds,
    };
  } catch (error) {
    logger.error('Error in getLabStats', error instanceof Error ? error : new Error(String(error)), { studentId });
    // Return empty stats on error
    return {
      totalLabs: LAB_TOTAL,
      completedLabs: 0,
      completionPercentage: 0,
      completedLabIds: [],
    };
  }
}

export async function isLabCompleted(supabase: SupabaseClient, studentId: string, labId: string): Promise<boolean> {
  try {
    const { data: resultData, error } = await supabase
      .from('lab_completions')
      .select('id')
      .eq('student_id', studentId)
      .eq('lab_id', labId)
      .limit(1);

    if (error) {
      logger.error('Failed to check lab completion status', error as any, {
        studentId,
        labId
      });
      return false;
    }

    return !!resultData?.[0];
  } catch (error) {
    logger.error('Error in isLabCompleted', error instanceof Error ? error : new Error(String(error)), { studentId, labId });
    return false;
  }
}
