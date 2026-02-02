import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProctoringComponentProps {
    isActive: boolean;
    onStatusChange: (status: 'ok' | 'violation') => void;
}

export const ProctoringComponent: React.FC<ProctoringComponentProps> = ({ isActive, onStatusChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [status, setStatus] = useState<'ok' | 'violation' | 'loading'>('loading');
    const streamRef = useRef<MediaStream | null>(null);

    // Load Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models/face-api';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // Optional: for looking away
                setModelLoaded(true);
            } catch (e) {
                console.error('Failed to load face-api models', e);
            }
        };
        loadModels();
    }, []);

    // Start/Stop Camera based on isActive
    useEffect(() => {
        if (isActive && modelLoaded) {
            startVideo();
        } else {
            stopVideo();
        }
        return () => stopVideo();
    }, [isActive, modelLoaded]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 } // Low res is fine for detection
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            // Fail safely? Or notify violation? For now, let's treat no camera as violation.
            onStatusChange('violation');
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Detection Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let warmupComplete = false;

        // Give user 5 seconds to get positioned before flagging violations
        const warmupTimer = setTimeout(() => {
            warmupComplete = true;
        }, 5000);

        const detectFaces = async () => {
            if (!videoRef.current || !isActive || !modelLoaded) return;

            if (videoRef.current.paused || videoRef.current.ended) return;

            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            );

            // Violation Logic
            // 1. No face detected (User left)
            // 2. Multiple faces detected (Cheating)
            if (detections.length === 0 || detections.length > 1) {
                setStatus('violation');
                // Only call onStatusChange('violation') AFTER warmup period
                if (warmupComplete) {
                    onStatusChange('violation');
                }
            } else {
                setStatus('ok');
                // Always call ok - helps reset violation counts if user corrects themselves
                if (warmupComplete) {
                    onStatusChange('ok');
                }
            }
        };

        if (isActive && modelLoaded) {
            interval = setInterval(detectFaces, 1000); // Check every second
        }

        return () => {
            clearInterval(interval);
            clearTimeout(warmupTimer);
        };
    }, [isActive, modelLoaded, onStatusChange]);

    if (!isActive) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`relative rounded-lg overflow-hidden border-2 shadow-2xl transition-colors duration-300 ${status === 'violation' ? 'border-red-500 shadow-red-500/50' : 'border-[#00FF88] shadow-[#00FF88]/20'}`}>
                {/* Status Overlay */}
                <div className="absolute top-0 left-0 right-0 p-2 bg-black/70 backdrop-blur-sm flex items-center justify-between text-xs font-bold z-10">
                    <div className="flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>AI PROCTOR</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${status === 'violation' ? 'text-red-500' : 'text-[#00FF88]'}`}>
                        {status === 'violation' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        <span>{status === 'violation' ? 'VIOLATION' : 'SECURE'}</span>
                    </div>
                </div>

                {/* Video Feed */}
                <div className="w-48 h-36 bg-black relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                    {!modelLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
                            Loading Models...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
