import { useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '@lib/apiConfig';

interface ProctoringConfig {
  studentId: string;
  courseId: string;
  attemptId: string;
  enabled: boolean;
}

const normalizeEventType = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '') || 'unknown_event';

export const useProctoring = ({ studentId, courseId, attemptId, enabled }: ProctoringConfig) => {
  const lastEventTsRef = useRef<Record<string, number>>({});

  const logEvent = useCallback(
    (eventType: string, details: any = {}) => {
      if (!enabled) return;

      // Debounce frequent events
      const now = Date.now();
      const lastTs = lastEventTsRef.current[eventType] || 0;
      if (now - lastTs < 2000 && !['exam_start', 'exam_end'].includes(eventType)) {
        return;
      }
      lastEventTsRef.current[eventType] = now;

      const payload = JSON.stringify({
        studentId,
        courseId,
        attemptId,
        eventType: normalizeEventType(eventType),
        details,
        timestamp: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(getApiUrl('/api/student/track/proctor/ingest'), blob);
      } else {
        fetch(getApiUrl('/api/student/track/proctor/ingest'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          /* Silently fail */
        });
      }
    },
    [studentId, courseId, attemptId, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logEvent('tab_switch', { state: 'hidden' });
      }
    };

    const handleBlur = () => {
      logEvent('window_blur');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent('exit_fullscreen');
      }
    };

    const handleCopy = () => logEvent('copy_attempt');
    const handlePaste = () => logEvent('paste_attempt');
    const handleCut = () => logEvent('cut_attempt');
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent('context_menu_attempt');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      const blockedCombos =
        (ctrlOrMeta && ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        key === 'f12';

      if (blockedCombos) {
        e.preventDefault();
        logEvent('shortcut_blocked', {
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, logEvent]);

  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen && !document.fullscreenElement) {
      element.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    }
  }, []);

  return { requestFullscreen, logEvent };
};
