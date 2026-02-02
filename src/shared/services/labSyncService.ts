/**
 * Service for syncing lab completion status from external render website
 */
import { getApiUrl } from '@lib/apiConfig';

interface LabSyncPayload {
    studentId: string;
    labId: string;
    completedAt?: string;
    metadata?: Record<string, unknown>;
}

const WEBHOOK_URL = getApiUrl('/api/student/labs/webhook/complete');

/**
 * Sync lab completion from external render website
 * This is called by the render website when a student completes a lab
 */
export async function syncLabCompletion(payload: LabSyncPayload): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Add webhook secret header
                // 'X-Webhook-Secret': process.env.LAB_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                studentId: payload.studentId,
                labId: payload.labId,
                completedAt: payload.completedAt || new Date().toISOString(),
                metadata: payload.metadata || {},
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error('Failed to sync lab completion:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if lab completion sync is available
 */
export async function checkLabSyncHealth(): Promise<boolean> {
    try {
        const healthUrl = WEBHOOK_URL.replace('/webhook/complete', '/webhook/health');
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.ok;
    } catch {
        return false;
    }
}

