/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  // mediaStream is not used by the component but kept in the signature for future use
  mediaStream?: MediaStream | null;
  enabled?: boolean;
  onViolation?: (count: number, reason: string) => void;
  onEndExam?: () => void;
  onStatusChange?: (s: string) => void;
  onViolationWarning?: (reason: string, count: number, threshold: number) => void;
  threshold?: number; // end when violations >= threshold (default 3)
  opencvUrl?: string;
  modelsPath?: string; // default /models
};

declare global {
  interface Window {
    cv?: any;
  }
}

const DEFAULT_OPENCV_URL = 'https://cdn.jsdelivr.net/npm/opencv.js@4.5.5/dist/opencv.js';
const CASCADE_FILENAME = 'haarcascade_frontalface_default.xml';
// Simplify: use only face-api for detection to ensure consistent behavior
const USE_FACE_API_ONLY = true;
const ENABLE_NETWORK_LOGS = false;
const SHOW_DEBUG_UI = false; // hide any on-screen UI/overlay

export const Proctoring: React.FC<Props> = ({
  videoRef,
  onViolation,
  onEndExam,
  enabled = true,
  threshold = 3,
  onStatusChange,
  onViolationWarning,
  opencvUrl = DEFAULT_OPENCV_URL,
  modelsPath = '/models',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>('initializing');
  const rafRef = useRef<number | null>(null);
  const lastProcessRef = useRef<number>(0);
  const classifierRef = useRef<any>(null);
  const processingRef = useRef(false);
  const noFaceCountRef = useRef(0);
  const multiFaceCountRef = useRef(0);
  const faceDetectorRef = useRef<any>(null);
  const faceApiRef = useRef<any>(null);
  const scriptRefs = useRef<{ opencv?: HTMLScriptElement | null; faceapi?: HTMLScriptElement | null }>({ opencv: null, faceapi: null });
  const [detectorReady, setDetectorReady] = useState(false);
  const [activeDetector, setActiveDetector] = useState<string>('none');
  const lastUsedDetectorRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const lastWindowEventTsRef = useRef<number>(0);
  const windowEventCooldownMs = 2500; // ensure at most one violation per blur/tab switch

  const [logs, setLogs] = useState<Array<{ id: number; ts: number; msg: string }>>([]);
  const logCounterRef = useRef(0);

  const pushLog = (msg: string) => {
    const id = ++logCounterRef.current;
    const entry = { id, ts: Date.now(), msg };
    setLogs((l) => {
      const next = [entry, ...l].slice(0, 50);
      return next;
    });
    if (ENABLE_NETWORK_LOGS) void sendLog({ event: 'client-log', message: msg });
  };

  // helper logging (fire-and-forget)
  const sendLog = async (payload: any) => {
    try {
      await fetch('/proctor-logs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    } catch {
      // ignore network logging failures
    }
  };

  // Helper to update status and call onStatusChange only when it changes
  const setStatusSafe = (s: string) => {
    setStatus((prev) => {
      if (prev !== s) {
        if (onStatusChange) onStatusChange(s);
        return s;
      }
      return prev;
    });
  };

  useEffect(() => {
    mountedRef.current = true;
    // one-per-event window blur/tab switch violations
    const onVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastWindowEventTsRef.current > windowEventCooldownMs) {
          lastWindowEventTsRef.current = now;
          pushLog('visibility hidden -> violation');
          incrementViolation('window_blur');
        }
      }
    };
    const onBlur = () => {
      const now = Date.now();
      if (now - lastWindowEventTsRef.current > windowEventCooldownMs) {
        lastWindowEventTsRef.current = now;
        pushLog('window blur -> violation');
        incrementViolation('window_blur');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load OpenCV.js robustly (refactored so it can be retried)
  const loadOpenCvNow = async (): Promise<void> => {
    if (!(window as any).document) return;
    try {
      if ((window as any).cv) {
        pushLog('OpenCV already present');
        return;
      }

      // Wait for OpenCV to be ready
      return new Promise<void>((resolve) => {
        const s = document.createElement('script');
        s.src = opencvUrl;
        s.async = true;
        s.onload = () => {
          pushLog('OpenCV script loaded');
          // Wait for cv to be available and fully initialized
          const checkCv = () => {
            const cv = (window as any).cv;
            if (cv && cv.Mat && cv.CascadeClassifier) {
              pushLog('OpenCV fully loaded and ready');
              resolve();
            } else if (cv && cv.onRuntimeInitialized) {
              cv.onRuntimeInitialized = () => {
                pushLog('OpenCV runtime initialized');
                resolve();
              };
            } else if (cv) {
              pushLog('OpenCV available, waiting for full initialization...');
              setTimeout(checkCv, 200);
            } else {
              setTimeout(checkCv, 100);
            }
          };
          checkCv();
        };
        s.onerror = () => {
          pushLog('OpenCV script failed to load');
          resolve();
        };
        document.body.appendChild(s);
        scriptRefs.current.opencv = s;
      });
    } catch (err) {
      pushLog(`loadOpenCvNow error: ${String(err)}`);
    }
  };

  const setupCascadeNow = async (): Promise<void> => {
    try {
      const cv = (window as any).cv;
      if (!cv) {
        pushLog('setupCascadeNow: opencv not available yet');
        return;
      }

      // Check if OpenCV is fully loaded
      if (!cv.Mat || !cv.CascadeClassifier) {
        pushLog('OpenCV not fully loaded yet, waiting...');
        return;
      }

      const res = await fetch(`${modelsPath}/${CASCADE_FILENAME}`);
      if (!res.ok) throw new Error(`Cascade fetch failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const data = new Uint8Array(buffer);

      if (!cv.FS_createDataFile) throw new Error('opencv FS_createDataFile not present');

      // Create the cascade file in OpenCV's virtual filesystem
      cv.FS_createDataFile('/', CASCADE_FILENAME, data, true, false, false);

      const classifier = new cv.CascadeClassifier();

      // Use loadFromData instead of load for better compatibility
      let loaded = false;
      try {
        loaded = classifier.loadFromData(data);
      } catch (loadError) {
        pushLog(`loadFromData failed, trying load: ${String(loadError)}`);
        // Fallback to load method
        loaded = classifier.load(CASCADE_FILENAME);
      }

      if (!loaded) {
        classifierRef.current = null;
        pushLog('Cascade failed to load via both methods');
        await sendLog({ event: 'cascade-load-failed' });
        return;
      }

      classifierRef.current = classifier;
      pushLog('Cascade loaded successfully');
      await sendLog({ event: 'cascade-loaded' });
    } catch (err) {
      classifierRef.current = null;
      pushLog(`setupCascadeNow error: ${String(err)}`);
      await sendLog({ event: 'cascade-setup-error', error: String(err) });
    }
  };

  // effect: attempt initial load on mount (skip when face-api only)
  useEffect(() => {
    if (!enabled) return;
    if (USE_FACE_API_ONLY) return;
    void loadOpenCvNow();
    const iv = setInterval(() => {
      if ((window as any).cv) {
        void setupCascadeNow();
        clearInterval(iv);
      }
    }, 300);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, opencvUrl, modelsPath]);

  // Initialize native FaceDetector + face-api.js
  // native FaceDetector init (skip when face-api only)
  useEffect(() => {
    if (!enabled || USE_FACE_API_ONLY) return;
    try {
      if ((window as any).FaceDetector) {
        try {
          faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
          pushLog('Native FaceDetector initialized');
        } catch (e) {
          faceDetectorRef.current = null;
          console.debug('FaceDetector init failed', e);
          pushLog('Native FaceDetector init failed');
        }
      }
    } catch {
      faceDetectorRef.current = null;
    }
  }, [enabled]);

  // face-api loader (callable)
  const loadFaceApiNow = async (): Promise<void> => {
    try {
      if ((window as any).faceapi) {
        faceApiRef.current = (window as any).faceapi;
        pushLog('face-api already present');
        return;
      }

      // try local bundled copy first (/libs/face-api.min.js), then CDN
      const tryLoad = (src: string) =>
        new Promise<void>((resolve) => {
          const s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.onload = () => {
            pushLog(`face-api script loaded from ${src}`);
            resolve();
          };
          s.onerror = () => {
            pushLog(`face-api script failed to load from ${src}`);
            resolve();
          };
          document.body.appendChild(s);
          scriptRefs.current.faceapi = s;
        });

      // try local
      await tryLoad('/libs/face-api.min.js');
      if (!(window as any).faceapi) {
        // try CDN
        await tryLoad('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
      }

      if ((window as any).faceapi) {
        const fa = (window as any).faceapi;
        try {
          // Check if models are already loaded
          if (fa.nets && fa.nets.tinyFaceDetector && fa.nets.tinyFaceDetector.isLoaded) {
            pushLog('face-api models already loaded');
            faceApiRef.current = fa;
            return;
          }

          // Load models from the correct path
          pushLog('Loading face-api models...');
          await fa.nets.tinyFaceDetector.loadFromUri(`${modelsPath}/face-api`);
          faceApiRef.current = fa;
          pushLog('face-api models loaded successfully');
          await sendLog({ event: 'faceapi-loaded' });
        } catch (err) {
          pushLog(`face-api models failed to load: ${String(err)}`);
          await sendLog({ event: 'faceapi-models-missing', error: String(err) });
        }
      } else {
        pushLog('face-api library not available');
      }
    } catch (err) {
      pushLog(`loadFaceApiNow error: ${String(err)}`);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    void loadFaceApiNow();
  }, [enabled, modelsPath]);

  // mark detectorReady: for face-api only mode, wait for face-api model
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const detectReady = () => {
      const haveFaceApiModel = !!(faceApiRef.current && faceApiRef.current.nets && faceApiRef.current.nets.tinyFaceDetector);
      const ready = USE_FACE_API_ONLY
        ? haveFaceApiModel
        : (haveFaceApiModel || !!classifierRef.current || !!(window as any).FaceDetector || !!(window as any).cv);
      if (ready) {
        if (!detectorReady) {
          pushLog('detectorReady => true');
          setDetectorReady(true);
        }
        setStatusSafe('ready');
        if (!activeDetector || activeDetector === 'none') {
          if (haveFaceApiModel) setActiveDetector('faceapi');
        }
      } else {
        if (detectorReady) pushLog('detectorReady => false');
        setDetectorReady(false);
      }
    };

    // periodically check for readiness (OpenCV cascade may finish loading async)
    const checker = setInterval(() => {
      if (cancelled) return;
      detectReady();
    }, 300);

    // initial check run
    detectReady();

    return () => {
      cancelled = true;
      clearInterval(checker);
    };
  }, [enabled, modelsPath, detectorReady, status]); // detectorReady and status included to allow stable transitions

  // create overlay canvas once (hidden when SHOW_DEBUG_UI=false)
  useEffect(() => {
    const overlay = overlayRef.current || document.createElement('canvas');
    overlayRef.current = overlay;
    overlay.width = 320;
    overlay.height = 240;
    overlay.style.position = 'absolute';
    overlay.style.top = '8px';
    overlay.style.left = '8px';
    overlay.style.width = '160px';
    overlay.style.height = '120px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.display = SHOW_DEBUG_UI ? 'block' : 'none';
    document.body.appendChild(overlay);

    return () => {
      try {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      } catch (e) { console.debug('overlay removal error', e); }
    };
  }, []);

  // frame loop
  useEffect(() => {
    if (!enabled) return;
    if (!detectorReady) {
      // don't start until detectorReady is true
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const overlay = overlayRef.current!;
    const frameCounterRef = { current: 0 } as { current: number };
    const processFrame = async (ts?: number) => {
      const now = ts ?? performance.now();
      if (now - lastProcessRef.current < 500) {
        rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));
        return;
      }
      lastProcessRef.current = now;

      frameCounterRef.current += 1;
      // log every 10 frames to avoid flooding
      const shouldLog = frameCounterRef.current % 10 === 0;

      if (processingRef.current) {
        rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));
        return;
      }
      if (shouldLog) pushLog(`processFrame start (frame ${frameCounterRef.current})`);
      if (!videoRef.current) {
        if (shouldLog) pushLog('videoRef missing in processFrame');
        rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));
        return;
      }
      const video = videoRef.current;
      if (video.readyState < 2) {
        if (shouldLog) pushLog(`video readyState ${video.readyState} (waiting)`);
        rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));
        return;
      }

      if (shouldLog) pushLog(`video dimensions ${video.videoWidth}x${video.videoHeight} readyState=${video.readyState}`);

      processingRef.current = true;
      let bitmapForDetector: ImageBitmap | null = null;
      try {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          pushLog('canvas getContext failed');
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (shouldLog) pushLog(`canvas drawn ${canvas.width}x${canvas.height}`);

        let count = 0;
        const facesArray: Array<{ x: number; y: number; w: number; h: number }> = [];

        const cv = (window as any).cv;
        if (!USE_FACE_API_ONLY && classifierRef.current && cv) {
          if (shouldLog) pushLog('entering OpenCV cascade branch');
          // OpenCV cascade branch
          let src: any = null;
          let gray: any = null;
          let faces: any = null;
          try {
            src = cv.imread(canvas);
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            faces = new cv.RectVector();

            // Use proper parameters for detectMultiScale
            const scaleFactor = 1.1;
            const minNeighbors = 3;
            const flags = 0;
            const minSize = new cv.Size(30, 30);
            const maxSize = new cv.Size(0, 0);

            classifierRef.current.detectMultiScale(gray, faces, scaleFactor, minNeighbors, flags, minSize, maxSize);

            count = faces.size();
            for (let i = 0; i < faces.size(); i++) {
              const r = faces.get(i);
              facesArray.push({ x: r.x, y: r.y, w: r.width, h: r.height });
            }

            lastUsedDetectorRef.current = 'opencv';
            if (activeDetector !== 'opencv') setActiveDetector('opencv');
            if (shouldLog) pushLog(`OpenCV detected faces=${count}`);
          } catch (err) {
            console.debug('OpenCV detect error', err);
            pushLog(`OpenCV detect error: ${String(err)}`);
            await sendLog({ event: 'opencv-detect-error', error: String(err) });
          } finally {
            try { if (src) src.delete(); } catch { /* ignore */ }
            try { if (gray) gray.delete(); } catch { /* ignore */ }
            try { if (faces) faces.delete(); } catch { /* ignore */ }
          }
        } else if (!USE_FACE_API_ONLY && faceDetectorRef.current && faceDetectorRef.current.detect) {
          if (shouldLog) pushLog('entering native FaceDetector branch');
          // native FaceDetector
          try {
            bitmapForDetector = await createImageBitmap(canvas);
            const detected = await faceDetectorRef.current.detect(bitmapForDetector);
            count = Array.isArray(detected) ? detected.length : 0;
            for (const f of detected) {
              const b = (f as any).boundingBox || (f as any).box || { x: 0, y: 0, width: 0, height: 0 };
              facesArray.push({ x: b.x, y: b.y, w: b.width, h: b.height });
            }
            lastUsedDetectorRef.current = 'native';
            if (activeDetector !== 'native') setActiveDetector('native');
            if (shouldLog) pushLog(`native detected faces=${count}`);
          } catch (err) {
            console.debug('native FaceDetector detect error', err);
            pushLog(`native FaceDetector error: ${String(err)}`);
            await sendLog({ event: 'native-detect-error', error: String(err) });
          } finally {
            try { if (bitmapForDetector) bitmapForDetector.close(); } catch { /* ignore */ }
            bitmapForDetector = null;
          }
        } else if (faceApiRef.current && faceApiRef.current.nets && faceApiRef.current.nets.tinyFaceDetector) {
          if (shouldLog) pushLog('entering face-api branch');
          // face-api.js tiny detector — pass HTMLCanvasElement directly (avoid ImageBitmap toNetInput error)
          try {
            const fa = faceApiRef.current;
            const detections = await fa.detectAllFaces(canvas, new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
            count = Array.isArray(detections) ? detections.length : 0;
            for (const d of detections) {
              const b = d.box || d.boundingBox || { x: 0, y: 0, width: 0, height: 0 };
              facesArray.push({ x: b.x, y: b.y, w: b.width, h: b.height });
            }
            lastUsedDetectorRef.current = 'faceapi';
            if (activeDetector !== 'faceapi') setActiveDetector('faceapi');
            if (shouldLog) pushLog(`face-api detected faces=${count}`);
          } catch (err) {
            console.debug('face-api detect error', err);
            pushLog(`face-api detect error: ${String(err)}`);
            await sendLog({ event: 'faceapi-detect-error', error: String(err) });
          }
        } else {
          // no detector available (shouldn't happen if detectorReady is true)
          pushLog('No detector available in frame loop');
        }
        pushLog(`Frame detected ${count} faces`);

        // consecutive-frame gating
        if (count === 0) {
          noFaceCountRef.current += 1;
          multiFaceCountRef.current = 0;
        } else if (count > 1) {
          multiFaceCountRef.current += 1;
          noFaceCountRef.current = 0;
        } else {
          noFaceCountRef.current = 0;
          multiFaceCountRef.current = 0;
        }

        if (noFaceCountRef.current >= 3) {
          incrementViolation('no_face');
          noFaceCountRef.current = 0;
        }
        if (multiFaceCountRef.current >= 3) {
          incrementViolation('multiple_faces');
          multiFaceCountRef.current = 0;
        }

        // draw overlay for debug (only when SHOW_DEBUG_UI)
        try {
          const octx = SHOW_DEBUG_UI ? overlay.getContext('2d') : null;
          if (octx) {
            octx.clearRect(0, 0, overlay.width, overlay.height);
            // scale down factor between canvas and overlay
            const sx = overlay.width / canvas.width;
            const sy = overlay.height / canvas.height;
            for (const f of facesArray) {
              octx.strokeStyle = 'lime';
              octx.lineWidth = 2;
              octx.strokeRect(f.x * sx, f.y * sy, f.w * sx, f.h * sy);
            }
          }
        } catch {
          console.debug('overlay draw error');
        }
      } catch (err) {
        console.error('processing error', err);
        await sendLog({ event: 'processing-error', error: String(err) });
      } finally {
        processingRef.current = false;
        try {
          rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));
        } catch { /* ignore */ }
      }
    };

    // start loop
    rafRef.current = window.requestAnimationFrame((t) => void processFrame(t));

    return () => {
      // cleanup: cancel rAF and ensure any ImageBitmap closed
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      processingRef.current = false;
    };
    // intentionally only dependent on enabled, detectorReady, and videoRef
  }, [enabled, detectorReady, videoRef]);

  const violationsRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const VIOLATION_COOLDOWN_MS = 5000; // 5 seconds between violation warnings


  function incrementViolation(reason: string) {
    violationsRef.current += 1;
    const now = Date.now();

    // Send violation callback
    if (onViolation) onViolation(violationsRef.current, reason);

    // Send warning callback (with cooldown to avoid spam)
    if (onViolationWarning && now - lastViolationTimeRef.current > VIOLATION_COOLDOWN_MS) {
      onViolationWarning(reason, violationsRef.current, threshold);
      lastViolationTimeRef.current = now;
    }

    // Check if exam should end
    if (violationsRef.current >= threshold) {
      stopProcessing();
      if (onEndExam) onEndExam();
      setStatusSafe('ended');
    }
  }

  function stopProcessing() {
    // try to free classifier and remove cascade file
    try {
      const cv = (window as any).cv;
      if (classifierRef.current) {
        // can't explicitly delete cascade classifier in opencv.js reliably
        classifierRef.current = null;
      }
      if (cv && (cv as any).FS_unlink) {
        try { (cv as any).FS_unlink(`/${CASCADE_FILENAME}`); } catch { /* ignore */ }
      }
    } catch {
      console.debug('stopProcessing error');
    }

    // remove scripts if present
    try {
      const s1 = scriptRefs.current.opencv;
      if (s1 && s1.parentNode) s1.parentNode.removeChild(s1);
      scriptRefs.current.opencv = null;
    } catch { /* ignore */ }
    try {
      const s2 = scriptRefs.current.faceapi;
      if (s2 && s2.parentNode) s2.parentNode.removeChild(s2);
      scriptRefs.current.faceapi = null;
    } catch { /* ignore */ }

    // remove overlay
    try {
      const overlay = overlayRef.current;
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlayRef.current = null;
    } catch { /* ignore */ }
  }

  // Cleanup on unmount: stop processing and remove resources
  useEffect(() => {
    return () => {
      stopProcessing();
      // cancel rAF if still running
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

  }, []);

  // UI — hidden in production; render nothing to keep UX seamless
  if (!SHOW_DEBUG_UI) return null;
  return (
    <div className="mt-4">
      <div className="text-sm text-gray-700 mb-2">Proctoring status: <strong className="capitalize">{status}</strong></div>
      <div className="mt-2 p-2 border rounded bg-gray-50 text-xs text-gray-700">
        <div><strong>Detector ready:</strong> {detectorReady ? 'yes' : 'no'}</div>
        <div><strong>Active detector:</strong> {activeDetector}</div>
        <div><strong>Processing:</strong> {processingRef.current ? 'yes' : 'no'}</div>
        <div><strong>Consecutive no-face:</strong> {noFaceCountRef.current}</div>
        <div><strong>Consecutive multi-face:</strong> {multiFaceCountRef.current}</div>
        <div className="mt-1 text-xs text-gray-500">Overlay rectangles are drawn to top-left of the page for visual debug.</div>
      </div>
      <div className="mt-2 p-2 border rounded bg-white text-xs text-gray-700">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold">Proctoring debug</div>
          <div className="space-x-1">
            <button className="px-2 py-1 border rounded text-xs" onClick={() => { pushLog('retry faceapi'); void loadFaceApiNow(); }}>Retry face-api</button>
          </div>
        </div>
        <div className="h-36 overflow-auto bg-gray-50 p-1">
          {logs.length === 0 ? <div className="text-gray-400">No logs yet</div> : null}
          <ul className="text-[11px] list-none m-0 p-0">
            {logs.map((l) => (
              <li key={l.id} className="mb-1">{new Date(l.ts).toLocaleTimeString()} — {l.msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Proctoring;
