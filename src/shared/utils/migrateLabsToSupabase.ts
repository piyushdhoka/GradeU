/**
 * One-time migration utility to sync localStorage lab completions to Supabase
 * This should be run once per user to preserve existing progress
 */
import { labApiService } from '@services/labApiService';

const COMPLETED_LABS_KEY = 'completed_labs';
const MIGRATION_COMPLETE_KEY = 'labs_migrated_to_supabase';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  alreadyMigrated: boolean;
}

/**
 * Check if migration has already been completed
 */
export const isMigrationComplete = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
};

/**
 * Migrate lab completions from localStorage to Supabase
 */
export const migrateLabCompletionsToSupabase = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
    alreadyMigrated: false,
  };

  // Check if already migrated
  if (isMigrationComplete()) {
    result.alreadyMigrated = true;
    result.success = true;
    return result;
  }

  // Check if running in browser
  if (typeof window === 'undefined') {
    result.errors.push('Migration can only run in browser environment');
    return result;
  }

  try {
    // Get completed labs from localStorage
    const stored = localStorage.getItem(COMPLETED_LABS_KEY);
    if (!stored) {
      // No data to migrate, mark as complete
      localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      result.success = true;
      return result;
    }

    const completedLabIds: string[] = JSON.parse(stored);

    if (completedLabIds.length === 0) {
      // No labs to migrate
      localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      result.success = true;
      return result;
    }

    console.log(`Migrating ${completedLabIds.length} lab completions to Supabase...`);

    // Migrate each lab completion
    for (const labId of completedLabIds) {
      try {
        await labApiService.markLabAsCompleted(labId);
        result.migratedCount++;
        console.log(`✓ Migrated lab: ${labId}`);
      } catch (error) {
        result.failedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to migrate ${labId}: ${errorMsg}`);
        console.error(`✗ Failed to migrate lab ${labId}:`, error);
      }
    }

    // Mark migration as complete if at least some succeeded
    if (result.migratedCount > 0 || result.failedCount === 0) {
      localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      result.success = true;
    }

    console.log(
      `Migration complete: ${result.migratedCount} succeeded, ${result.failedCount} failed`
    );

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
    console.error('Migration error:', error);
    return result;
  }
};

/**
 * Reset migration flag (for testing purposes)
 */
export const resetMigration = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MIGRATION_COMPLETE_KEY);
  }
};
