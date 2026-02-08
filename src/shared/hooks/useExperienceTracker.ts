import { useEffect, useRef } from 'react';
import { getApiUrl } from '@lib/apiConfig';
import { supabase } from '@lib/supabase';

interface ExperienceDetail {
  moduleId: string;
  timeSpent: number; // seconds
  scrollDepth: number; // percentage (0-100)
}

interface ExperienceConfig {
  studentId: string;
  studentEmail?: string;
  courseId: string;
  moduleId: string;
  enabled: boolean;
}

export const useExperienceTracker = ({
  studentId,
  studentEmail,
  courseId,
  moduleId,
  enabled,
}: ExperienceConfig) => {
  const startTimeRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const interactionsRef = useRef<number>(0);
  const scrollRequestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    interactionsRef.current = 0;

    const handleScroll = () => {
      if (scrollRequestRef.current) return;

      scrollRequestRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const scrollPercent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
          maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
        }
        scrollRequestRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll);
    const handleInteraction = () => {
      interactionsRef.current += 1;
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    // Sync data periodically (heartbeat every 30s) or on unmount
    const syncData = async () => {
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      const payload = JSON.stringify({
        studentId,
        studentEmail,
        courseId,
        moduleStats: {
          moduleId,
          timeSpent,
          scrollDepth: Math.round(maxScrollRef.current),
          interactions: interactionsRef.current,
        },
      });

      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        await fetch(getApiUrl('/api/student/track/experience/sync'), {
          method: 'POST',
          headers,
          body: payload,
          keepalive: true,
        });
      } catch {
        // Experience tracking should never block UX
      }

      // Reset timer for next interval
      startTimeRef.current = Date.now();
      interactionsRef.current = 0;
    };

    const intervalId = setInterval(syncData, 30000); // 30 seconds heartbeat

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (scrollRequestRef.current) {
        cancelAnimationFrame(scrollRequestRef.current);
      }
      clearInterval(intervalId);
      syncData(); // Final sync on unmount/module change
    };
  }, [studentId, studentEmail, courseId, moduleId, enabled]);

  return {};
};
