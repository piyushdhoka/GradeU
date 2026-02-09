/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

type Props = {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  mediaStream?: MediaStream | null;
  enabled?: boolean;
  onViolation?: (count: number, reason: string) => void;
  onEndExam?: () => void;
  onStatusChange?: (s: string) => void;
  onViolationWarning?: (reason: string, count: number, threshold: number) => void;
  threshold?: number;
};

// Configuration
const FRAME_INTERVAL_MS = 200; // 5 FPS (further reduced from 10 FPS to save CPU)
const NO_FACE_FRAMES_BEFORE_VIOLATION = 10; // ~2 seconds at 5 FPS
const MULTI_FACE_FRAMES_BEFORE_VIOLATION = 10; // ~2 seconds at 5 FPS
const TAB_SWITCH_COOLDOWN_MS = 2000; // Cooldown for tab switch events

export const Proctoring: React.FC<Props> = ({
  mediaStream,
  enabled = true,
  threshold = 3,
  onViolation,
  onEndExam,
  onStatusChange,
  onViolationWarning,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [videoReady, setVideoReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);

  const blazefaceModelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastProcessRef = useRef<number>(0);
  const processingRef = useRef(false);

  // Violation tracking
  const noFaceCountRef = useRef(0);
  const multiFaceCountRef = useRef(0);
  const violationCountRef = useRef(0);
  const terminatedRef = useRef(false); // CRITICAL: Track if exam already terminated

  const mountedRef = useRef(true);
  const lastWindowEventTsRef = useRef<number>(0);
  const lastViolationTsRef = useRef<number>(0); // NEW: Grace period tracking

  const pushLog = useCallback((msg: string) => {
    console.log(`[Proctoring] ${msg}`);
  }, []);

  // Increment violation - STOPS at threshold
  const incrementViolation = useCallback(
    (reason: string) => {
      // Don't increment if already terminated
      if (terminatedRef.current) return;

      // Grace period check (3 seconds)
      const now = Date.now();
      if (now - lastViolationTsRef.current < 3000) {
        return;
      }
      lastViolationTsRef.current = now;

      violationCountRef.current += 1;
      const count = violationCountRef.current;

      pushLog(`🚨 Violation #${count}: ${reason}`);
      if (onViolation) onViolation(count, reason);

      // Check threshold BEFORE calling warning
      if (count >= threshold) {
        terminatedRef.current = true; // Mark as terminated
        pushLog(`❌ Threshold ${threshold} reached - terminating`);
        if (onEndExam) onEndExam();
      } else if (onViolationWarning) {
        onViolationWarning(reason, count, threshold);
      }
    },
    [threshold, onViolation, onEndExam, onViolationWarning, pushLog]
  );

  // Setup video when stream changes
  useEffect(() => {
    if (!mediaStream || terminatedRef.current) {
      setVideoReady(false);
      return;
    }

    pushLog('Setting up video element...');
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    video.onloadedmetadata = () => {
      video
        .play()
        .then(() => {
          pushLog(`✅ Video ready: ${video.videoWidth}x${video.videoHeight}`);
          internalVideoRef.current = video;
          setVideoReady(true);
        })
        .catch((err) => {
          pushLog(`Video play error: ${err}`);
        });
    };

    return () => {
      video.pause();
      video.srcObject = null;
      internalVideoRef.current = null;
      setVideoReady(false);
    };
  }, [mediaStream, pushLog]);

  // Window events - only if not terminated
  useEffect(() => {
    if (!enabled || terminatedRef.current) return;

    mountedRef.current = true;

    const onVisibilityChange = () => {
      if (document.hidden && !terminatedRef.current) {
        pushLog('Tab hidden -> violation');
        incrementViolation('tab_switch');
      }
    };

    const onBlur = () => {
      if (terminatedRef.current) return;
      const now = Date.now();
      if (now - lastWindowEventTsRef.current > TAB_SWITCH_COOLDOWN_MS) {
        lastWindowEventTsRef.current = now;
        pushLog('Window blur -> violation');
        incrementViolation('window_blur');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled, incrementViolation, pushLog]);

  // Load BlazeFace
  useEffect(() => {
    if (!enabled) return;

    const loadModel = async () => {
      try {
        pushLog('Loading BlazeFace...');
        if (onStatusChange) onStatusChange('loading');

        await tf.ready();
        const model = await blazeface.load();
        blazefaceModelRef.current = model;

        pushLog('✅ BlazeFace loaded');
        setDetectorReady(true);
        if (onStatusChange) onStatusChange('ready');
      } catch (err) {
        pushLog(`❌ BlazeFace error: ${err}`);
        if (onStatusChange) onStatusChange('error');
      }
    };

    void loadModel();
  }, [enabled, onStatusChange, pushLog]);

  // Frame processing loop
  useEffect(() => {
    if (!enabled || !detectorReady || !videoReady || terminatedRef.current) {
      return;
    }

    pushLog('🎬 Starting face detection');
    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning || terminatedRef.current) return;

      const video = internalVideoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (isRunning && !terminatedRef.current) {
          rafRef.current = window.requestAnimationFrame(() => void processFrame());
        }
        return;
      }

      const now = performance.now();
      if (now - lastProcessRef.current < FRAME_INTERVAL_MS) {
        if (isRunning && !terminatedRef.current) {
          rafRef.current = window.requestAnimationFrame(() => void processFrame());
        }
        return;
      }
      lastProcessRef.current = now;

      if (processingRef.current) {
        if (isRunning && !terminatedRef.current) {
          rafRef.current = window.requestAnimationFrame(() => void processFrame());
        }
        return;
      }
      processingRef.current = true;

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let faceCount = 0;
        if (blazefaceModelRef.current) {
          try {
            const predictions = await blazefaceModelRef.current.estimateFaces(canvas, false);
            faceCount = predictions?.length || 0;
          } catch (err) {
            console.error('BlazeFace error:', err);
          }
        }

        // Only check violations if not terminated
        if (!terminatedRef.current) {
          // Skip check during grace period
          if (Date.now() - lastViolationTsRef.current < 3000) {
            noFaceCountRef.current = 0;
            multiFaceCountRef.current = 0;
            return;
          }

          if (faceCount === 0) {
            noFaceCountRef.current += 1;
            multiFaceCountRef.current = 0;

            if (noFaceCountRef.current >= NO_FACE_FRAMES_BEFORE_VIOLATION) {
              incrementViolation('no_face');
              noFaceCountRef.current = 0;
            }
          } else if (faceCount > 1) {
            multiFaceCountRef.current += 1;
            noFaceCountRef.current = 0;

            if (multiFaceCountRef.current >= MULTI_FACE_FRAMES_BEFORE_VIOLATION) {
              incrementViolation('multiple_faces');
              multiFaceCountRef.current = 0;
            }
          } else {
            noFaceCountRef.current = 0;
            multiFaceCountRef.current = 0;
          }
        }
      } finally {
        processingRef.current = false;
        if (isRunning && !terminatedRef.current) {
          rafRef.current = window.requestAnimationFrame(() => void processFrame());
        }
      }
    };

    rafRef.current = window.requestAnimationFrame(() => void processFrame());

    return () => {
      isRunning = false;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, detectorReady, videoReady, incrementViolation, pushLog]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

export default Proctoring;
