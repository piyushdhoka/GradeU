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
    webgazer?: any;
  }
}

type Engine = 'mediapipe' | 'webgazer' | 'native' | 'lite';

const MEDIAPIPE_FACE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';
const WEBGAZER_URL = 'https://webgazer.cs.brown.edu/webgazer.js';

export const ProctoringComponent: React.FC<ProctoringComponentProps> = ({
  isActive,
  onStatusChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const mediaPipeDetectorRef = useRef<any>(null);
  const mediaPipeCountRef = useRef(0);
  const webgazerStartedRef = useRef(false);
  const loadAttemptedRef = useRef(false);
  const lastNotifiedRef = useRef<'ok' | 'violation' | 'loading'>('loading');
  const zeroCountRef = useRef(0);
  const multiCountRef = useRef(0);

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

  const loadScript = (src: string, key: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-proctor="${key}"]`
      ) as HTMLScriptElement | null;
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-proctor', key);
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
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

  const initializeWebgazer = async (): Promise<boolean> => {
    try {
      if (!window.webgazer) {
        await loadScript(WEBGAZER_URL, 'webgazer');
      }
      if (!window.webgazer) return false;
      await window.webgazer.begin();
      if (window.webgazer.showVideoPreview) window.webgazer.showVideoPreview(false);
      if (window.webgazer.showFaceOverlay) window.webgazer.showFaceOverlay(false);
      if (window.webgazer.showFaceFeedbackBox) window.webgazer.showFaceFeedbackBox(false);
      webgazerStartedRef.current = true;
      setEngine('webgazer');
      return true;
    } catch (e) {
      console.warn('WebGazer init failed', e);
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

      if (await initializeWebgazer()) {
        setDetectorReady(true);
        setIsDetectorLoading(false);
        setModelError('Running WebGazer fallback mode');
        setStatusSafe('ok');
        return;
      }

      if (window.FaceDetector) {
        nativeDetectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 4,
        });
        setEngine('native');
      } else {
        nativeDetectorRef.current = null;
        setEngine('lite');
      }

      setDetectorReady(true);
      setIsDetectorLoading(false);
      if (engine === 'lite') {
        setModelError('Running lightweight proctoring mode');
      }
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
      if (webgazerStartedRef.current && window.webgazer?.end) {
        try {
          window.webgazer.end();
        } catch {
          // ignore
        }
      }
      webgazerStartedRef.current = false;
    };
  }, []);

  const startVideo = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API unavailable. Please use HTTPS and a supported browser.');
      setStatus('loading');
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Ignore play race errors; autoplay+muted+playsInline is set on the element.
        }
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Camera access denied:', err);
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
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout> | null = null;
    if (isActive && detectorReady) {
      startTimer = setTimeout(() => {
        void startVideo();
      }, 0);
    } else {
      stopVideo();
    }
    return () => {
      if (startTimer) {
        clearTimeout(startTimer);
      }
      stopVideo();
    };
  }, [isActive, detectorReady]);

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
        setStatus('loading');
        return;
      }

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

      if (engine === 'webgazer' && window.webgazer?.getCurrentPrediction) {
        try {
          const prediction = await window.webgazer.getCurrentPrediction();
          if (!prediction && warmupComplete) {
            setStatusSafe('violation');
            return;
          }
          if (warmupComplete) setStatusSafe('ok');
          return;
        } catch (err) {
          console.warn('WebGazer prediction failed, falling back to lite', err);
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
