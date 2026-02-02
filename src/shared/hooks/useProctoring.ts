import { useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '@lib/apiConfig';

interface ProctoringConfig {
    studentId: string;
    courseId: string;
    attemptId: string;
    enabled: boolean;
}

export const useProctoring = ({ studentId, courseId, attemptId, enabled }: ProctoringConfig) => {

    const logEvent = useCallback((eventType: string, details: any = {}) => {
        if (!enabled) return;

        const payload = JSON.stringify({
            studentId,
            courseId,
            attemptId,
            eventType,
            details,
            timestamp: new Date().toISOString()
        });

        // Use sendBeacon for reliable, low-overhead logging
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(getApiUrl('/api/student/track/proctor/ingest'), blob);
        } else {
            fetch(getApiUrl('/api/student/track/proctor/ingest'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => { /* Silently fail */ });
        }
    }, [studentId, courseId, attemptId, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                logEvent('tab-switch', { state: 'hidden' });
            }
        };

        const handleBlur = () => {
            logEvent('window-blur');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logEvent('exit-fullscreen');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [enabled, logEvent]);

    const requestFullscreen = useCallback(() => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
                console.error('Fullscreen request failed:', err);
            });
        }
    }, []);

    return { requestFullscreen, logEvent };
};
