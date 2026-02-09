import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';

interface CameraSetupProps {
  onCameraReady: (stream: MediaStream) => void;
  onCancel: () => void;
  isEngineReady?: boolean;
}

export const CameraSetup: React.FC<CameraSetupProps> = ({
  onCameraReady,
  onCancel,
  isEngineReady = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          setIsLoading(false);
        };
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions to proceed.'
          : 'Failed to access camera. Please check your camera is connected and not in use.'
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleProceed = () => {
    if (stream) {
      onCameraReady(stream);
    }
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8">
      <Card className="border-primary/20">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Camera className="text-primary h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Camera Setup</h2>
              <p className="text-muted-foreground">
                This exam is proctored. Please ensure your face is clearly visible.
              </p>
            </div>

            {/* Video Preview */}
            <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full scale-x-[-1]"
              />

              {/* Overlay States */}
              {isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Camera className="mx-auto mb-2 h-12 w-12 animate-pulse" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center text-white">
                    <CameraOff className="mx-auto mb-2 h-12 w-12 text-red-500" />
                    <p className="text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {cameraReady && !error && (
                <div className="absolute top-4 left-4 rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
                  <CheckCircle className="mr-1 inline-block h-4 w-4" />
                  Camera Ready
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="flex gap-3">
                <AlertCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Before you begin:</p>
                  <ul className="text-muted-foreground list-inside list-disc space-y-1">
                    <li>Ensure your face is clearly visible in the camera</li>
                    <li>Use good lighting - avoid backlighting</li>
                    <li>Stay in frame throughout the exam</li>
                    <li>Do not switch tabs or windows during the exam</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!cameraReady || !!error || !isEngineReady}
                className="min-w-[150px]"
              >
                {error
                  ? 'Try Again'
                  : !isEngineReady
                    ? 'Loading AI...'
                    : cameraReady
                      ? 'Start Exam'
                      : 'Initializing...'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
