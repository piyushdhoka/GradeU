import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface ProctoringVideoFeedProps {
  mediaStream: MediaStream | null;
  isActive: boolean;
}

export const ProctoringVideoFeed: React.FC<ProctoringVideoFeedProps> = ({
  mediaStream,
  isActive,
}) => {
  // Use separate ref for display video to avoid conflicts with detection video
  const displayVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (displayVideoRef.current && mediaStream) {
      displayVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  if (!isActive || !mediaStream) return null;

  return (
    <div className="border-primary/50 fixed bottom-4 left-4 z-50 overflow-hidden rounded-lg border-2 bg-black shadow-2xl">
      <div className="relative">
        <video
          ref={displayVideoRef}
          autoPlay
          playsInline
          muted
          className="h-32 w-40 scale-x-[-1] object-cover"
        />
        <div className="absolute top-2 right-2 rounded-full bg-red-500 p-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        </div>
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1">
          <div className="flex items-center gap-1 text-xs text-white">
            <Camera className="h-3 w-3" />
            <span className="font-medium">Proctoring Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
