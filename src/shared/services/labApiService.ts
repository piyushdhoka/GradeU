// Frontend service for lab completion API calls
import { supabase } from '@lib/supabase';
import { labs } from '@data/labs';

export interface LabStats {
  totalLabs: number;
  completedLabs: number;
  completionPercentage: number;
  completedLabIds: string[];
}

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

// In-memory cache for lab stats to reduce API calls
let labStatsCache: { data: LabStats; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const labApiService = {
  async markLabAsCompleted(labId: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/student/labs/${labId}/complete`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to mark lab as completed');
      }

      // Invalidate cache on completion
      labStatsCache = null;

      return await response.json();
    } catch (error) {
      console.error('Error marking lab as completed:', error);
      throw error;
    }
  },

  async getLabStats(): Promise<LabStats> {
    const emptyStats: LabStats = {
      totalLabs: labs.length, // Dynamic count based on actual labs
      completedLabs: 0,
      completionPercentage: 0,
      completedLabIds: [],
    };

    // Check cache first
    if (labStatsCache && Date.now() - labStatsCache.timestamp < CACHE_DURATION) {
      return labStatsCache.data;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/student/labs/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        // Return empty stats for any non-ok response (auth issues, backend down, etc.)
        if (response.status !== 500) {
          console.warn(`Lab stats unavailable (HTTP ${response.status})`);
        }
        return emptyStats;
      }

      const stats = await response.json();

      // Update cache
      labStatsCache = {
        data: stats,
        timestamp: Date.now(),
      };

      return stats;
    } catch (error) {
      // Network error, backend not running, etc. - just return empty stats
      console.warn(
        'Lab stats service unavailable:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return emptyStats;
    }
  },

  async getLabStatus(labId: string): Promise<{ labId: string; completed: boolean }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/student/labs/${labId}/status`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { labId, completed: false };
        }
        throw new Error('Failed to fetch lab status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching lab status:', error);
      return { labId, completed: false };
    }
  },

  // Helper function to get completed lab IDs (replaces localStorage getCompletedLabs)
  async getCompletedLabs(): Promise<string[]> {
    try {
      const stats = await this.getLabStats();
      return stats.completedLabIds;
    } catch (error) {
      console.error('Error fetching completed labs:', error);
      return [];
    }
  },

  // Helper function to check if a specific lab is completed (replaces localStorage isLabCompleted)
  async isLabCompleted(labId: string): Promise<boolean> {
    try {
      const status = await this.getLabStatus(labId);
      return status.completed;
    } catch (error) {
      console.error('Error checking lab completion:', error);
      return false;
    }
  },

  // Clear cache (useful for forcing refresh)
  clearCache(): void {
    labStatsCache = null;
  },
};
