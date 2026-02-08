import React, { useEffect, useRef, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProctoringComponentProps {
  isActive: boolean;
  onStatusChange: (status: 'ok' | 'violation') => void;
}

declare global {
  interface Window {
    FaceDetector?: any;
    FaceDetection?: any;
  }
}

type Engine = 'mediapipe' | 'native' | 'lite';

const MEDIAPIPE_FACE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';

export const ProctoringComponent: React.FC<ProctoringComponentProps> = ({
  isActive,
  onStatusChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const mediaPipeDetectorRef = useRef<any>(null);
  const mediaPipeCountRef = useRef(0);
  const loadAttemptedRef = useRef(false);
  const lastNotifiedRef = useRef<'ok' | 'violation' | 'loading'>('loading');
  const zeroCountRef = useRef(0);
  const multiCountRef = useRef(0);
  const missingTrackCountRef = useRef(0);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraStartInFlightRef = useRef<Promise<void> | null>(null);
  const restartAttemptRef = useRef(0);

  const [detectorReady, setDetectorReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDetectorLoading, setIsDetectorLoading] = useState(true);
  const [status, setStatus] = useState<'ok' | 'violation' | 'loading'>('loading');
  const [engine, setEngine] = useState<Engine>('lite');

  const setStatusSafe = (next: 'ok' | 'violation' | 'loading') => {
    setStatus(next);
    if (next !== 'loading' && next !== lastNotifiedRef.current) {
      lastNotifiedRef.current = next;
      onStatusChange(next);
    }
  };

  const loadScript = (src: string, key: string, timeoutMs = 8000) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[data-proctor="${key}"]`);
      if (existing?.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-proctor', key);

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        s.onload = null;
        s.onerror = null;
        fn();
      };

      const timeoutId = setTimeout(
        () => finish(() => reject(new Error(`Timed out loading ${src}`))),
        timeoutMs
      );

      s.onload = () => finish(resolve);
      s.onerror = () => finish(() => reject(new Error(`Failed to load ${src}`)));
      document.body.appendChild(s);
    });

  const initializeMediaPipe = async (): Promise<boolean> => {
    try {
      if (!window.FaceDetection) {
        await loadScript(MEDIAPIPE_FACE_URL, 'mediapipe-face');
      }
      if (!window.FaceDetection) return false;

      const detector = new window.FaceDetection({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      detector.setOptions({
        model: 'short',
        minDetectionConfidence: 0.6,
      });

      detector.onResults((results: any) => {
        mediaPipeCountRef.current = Array.isArray(results?.detections)
          ? results.detections.length
          : 0;
      });

      mediaPipeDetectorRef.current = detector;
      setEngine('mediapipe');
      return true;
    } catch (e) {
      console.warn('MediaPipe init failed', e);
      return false;
    }
  };

  const initializeDetector = async () => {
    setIsDetectorLoading(true);
    setModelError(null);
    setStatus('loading');

    try {
      if (await initializeMediaPipe()) {
        setDetectorReady(true);
        setIsDetectorLoading(false);
        setStatusSafe('ok');
        return;
      }

      if (window.FaceDetector) {
        nativeDetectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 4,
        });
        setEngine('native');
        setModelError(null);
      } else {
        nativeDetectorRef.current = null;
        setEngine('lite');
        setModelError('Running lightweight proctoring mode');
      }

      setDetectorReady(true);
      setIsDetectorLoading(false);
      setStatusSafe('ok');
    } catch (error) {
      console.error('Failed to initialize proctoring detector', error);
      nativeDetectorRef.current = null;
      setEngine('lite');
      setDetectorReady(true);
      setIsDetectorLoading(false);
      setModelError('Running lightweight proctoring mode');
      setStatusSafe('ok');
    }
  };

  useEffect(() => {
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;
    const initTimer = setTimeout(() => {
      void initializeDetector();
    }, 0);

    return () => {
      clearTimeout(initTimer);
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
    };
  }, []);

  const clearRecoveryTimer = () => {
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  };

  const hasLiveTrack = () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    return !!track && track.readyState === 'live' && !track.muted;
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.onmute = null;
        track.onunmute = null;
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startVideo = async (isRecovery = false) => {
    if (hasLiveTrack()) {
      setCameraError(null);
      return;
    }

    if (cameraStartInFlightRef.current) {
      await cameraStartInFlightRef.current;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API unavailable. Please use HTTPS and a supported browser.');
      setStatus('loading');
      return;
    }

    const startPromise = (async () => {
      try {
        setCameraError(null);
        setStatus('loading');
        clearRecoveryTimer();

        if (navigator.permissions?.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
            if (permissionStatus.state === 'denied') {
              setCameraError('Camera permission denied. Allow camera access and retry.');
              return;
            }
          } catch {
            // Some browsers do not support querying camera permission.
          }
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoInput = devices.some((device) => device.kind === 'videoinput');
          if (!hasVideoInput) {
            setCameraError('No camera device found.');
            return;
          }
        } catch {
          // Continue; enumerateDevices can fail before permission grant in some browsers.
        }

        stopVideo();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            if (!isActive) return;
            scheduleCameraRecovery('track ended');
          };
          track.onmute = () => {
            if (!isActive) return;
            scheduleCameraRecovery('track muted');
          };
          track.onunmute = () => {
            setCameraError(null);
            missingTrackCountRef.current = 0;
          };
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Ignore play race errors; autoplay+muted+playsInline is set on the element.
          }
        }

        restartAttemptRef.current = 0;
        missingTrackCountRef.current = 0;
        setCameraError(null);
        if (detectorReady) {
          setStatusSafe('ok');
        }
      } catch (err) {
        console.error('Camera access failed:', err);
        const errorName = err instanceof DOMException ? err.name : '';
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Allow camera access and retry.');
        } else if (errorName === 'NotFoundError') {
          setCameraError('No camera device found.');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setCameraError('Camera is busy in another app/tab.');
        } else if (errorName === 'SecurityError') {
          setCameraError('Camera requires a secure (HTTPS) context.');
        } else {
          setCameraError('Unable to access camera.');
        }

        setStatus('loading');
        if (
          !isRecovery &&
          errorName !== 'NotAllowedError' &&
          errorName !== 'PermissionDeniedError'
        ) {
          scheduleCameraRecovery('initialization failure');
        }
      }
    })();

    cameraStartInFlightRef.current = startPromise;
    try {
      await startPromise;
    } finally {
      cameraStartInFlightRef.current = null;
    }
  };

  const scheduleCameraRecovery = (reason: string) => {
    if (!isActive || recoveryTimerRef.current) return;

    restartAttemptRef.current += 1;
    const delay = Math.min(3000, 300 * Math.pow(2, Math.min(restartAttemptRef.current, 3)));
    setCameraError(`Camera stream interrupted (${reason}). Reconnecting...`);
    setStatus('loading');

    recoveryTimerRef.current = setTimeout(() => {
      recoveryTimerRef.current = null;
      void startVideo(true);
    }, delay);
  };

  useEffect(() => {
    if (isActive) {
      void startVideo();
    } else {
      clearRecoveryTimer();
      stopVideo();
      missingTrackCountRef.current = 0;
      restartAttemptRef.current = 0;
      setStatus('loading');
      setCameraError(null);
    }

    return () => {
      clearRecoveryTimer();
      stopVideo();
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !navigator.mediaDevices?.addEventListener) return;

    const handleDeviceChange = () => {
      if (!hasLiveTrack()) {
        scheduleCameraRecovery('device change');
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibility = () => {
      if (document.hidden) setStatusSafe('violation');
    };
    const handleBlur = () => setStatusSafe('violation');

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    let warmupComplete = false;
    const warmupTimer = setTimeout(() => {
      warmupComplete = true;
    }, 5000);

    const evaluateFaceCount = (count: number) => {
      if (count === 0) {
        zeroCountRef.current += 1;
        multiCountRef.current = 0;
      } else if (count > 1) {
        multiCountRef.current += 1;
        zeroCountRef.current = 0;
      } else {
        zeroCountRef.current = 0;
        multiCountRef.current = 0;
      }

      if (!warmupComplete) return;
      if (zeroCountRef.current >= 2 || multiCountRef.current >= 2) {
        setStatusSafe('violation');
        return;
      }
      setStatusSafe('ok');
    };

    const detectFaces = async () => {
      if (!videoRef.current || !isActive || !detectorReady) return;

      const video = videoRef.current;
      if (video.paused || video.ended || video.readyState < 2) return;

      const track = streamRef.current?.getVideoTracks?.()[0];
      if (!track || track.readyState !== 'live' || track.muted) {
        missingTrackCountRef.current += 1;
        if (missingTrackCountRef.current >= 2) {
          scheduleCameraRecovery('inactive track');
        }
        setStatus('loading');
        return;
      }
      missingTrackCountRef.current = 0;

      if (document.hidden || !document.hasFocus()) {
        setStatusSafe('violation');
        return;
      }

      if (engine === 'mediapipe' && mediaPipeDetectorRef.current) {
        try {
          await mediaPipeDetectorRef.current.send({ image: video });
          evaluateFaceCount(mediaPipeCountRef.current);
          return;
        } catch (err) {
          console.warn('MediaPipe detect failed, falling back to lite', err);
          setEngine('lite');
        }
      }

      if (engine === 'native' && nativeDetectorRef.current?.detect) {
        try {
          const bitmap = await createImageBitmap(video);
          const detections = await nativeDetectorRef.current.detect(bitmap);
          bitmap.close();
          evaluateFaceCount(Array.isArray(detections) ? detections.length : 0);
          return;
        } catch (err) {
          console.warn('Native face detection failed, falling back to lite', err);
          nativeDetectorRef.current = null;
          setEngine('lite');
        }
      }

      if (warmupComplete) setStatusSafe('ok');
    };

    if (isActive && detectorReady) {
      interval = setInterval(() => {
        void detectFaces();
      }, 1000);
    }

    return () => {
      clearTimeout(warmupTimer);
      if (interval) clearInterval(interval);
    };
  }, [isActive, detectorReady, engine]);

  if (!isActive) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div
        className={`relative overflow-hidden rounded-lg border-2 shadow-2xl transition-colors duration-300 ${
          status === 'violation'
            ? 'border-red-500 shadow-red-500/50'
            : modelError
              ? 'border-amber-500 shadow-amber-500/20'
              : 'border-[#00FF88] shadow-[#00FF88]/20'
        }`}
      >
        <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-black/70 p-2 text-xs font-bold backdrop-blur-sm">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>AI PROCTOR</span>
          </div>
          <div
            className={`flex items-center space-x-1 ${
              status === 'violation'
                ? 'text-red-500'
                : status === 'loading' || modelError
                  ? 'text-amber-400'
                  : 'text-[#00FF88]'
            }`}
          >
            {status === 'violation' ? (
              <AlertTriangle className="h-3 w-3" />
            ) : status === 'loading' || modelError ? (
              <Shield className="h-3 w-3 animate-pulse" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            <span>
              {status === 'loading'
                ? 'LOADING'
                : status === 'violation'
                  ? 'VIOLATION'
                  : modelError
                    ? 'LIMITED'
                    : 'SECURE'}
            </span>
          </div>
        </div>

        <div className="relative h-36 w-48 bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full scale-x-[-1] transform object-cover"
          />
          {(!detectorReady || modelError || cameraError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2 text-center text-xs text-white/70">
              <div>
                {cameraError ||
                  modelError ||
                  (isDetectorLoading
                    ? 'Initializing proctoring...'
                    : 'Proctoring detector unavailable')}
              </div>
              <div className="text-[10px] text-white/40">Engine: {engine}</div>
              {cameraError ? (
                <button
                  type="button"
                  className="rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
                  onClick={() => void startVideo()}
                >
                  Enable Camera
                </button>
              ) : modelError ? (
                <button
                  type="button"
                  className="rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
                  onClick={() => void initializeDetector()}
                >
                  Retry
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
