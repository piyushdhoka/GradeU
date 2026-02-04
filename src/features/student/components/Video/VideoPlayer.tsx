import React, { useEffect, useRef, useMemo } from 'react';
import { usePlyr, PlyrSource, PlyrOptions } from 'plyr-react';
import 'plyr-react/plyr.css';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  isLive?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const getYouTubeId = (url: string): string | null => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0];
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  isLive = false,
  onProgress,
  onComplete,
}) => {
  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null;

  const plyrSource: PlyrSource = useMemo(
    () =>
      isYouTube
        ? {
            type: 'video',
            sources: [
              {
                src: youtubeId!,
                provider: 'youtube',
              },
            ],
          }
        : {
            type: 'video',
            sources: [
              {
                src: videoUrl,
                type: 'video/mp4',
              },
            ],
          },
    [isYouTube, youtubeId, videoUrl]
  );

  const plyrOptions: PlyrOptions = useMemo(
    () => ({
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['quality', 'speed', 'loop'],
      autoplay: false,
      seekTime: 10,
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      displayDuration: true,
      invertTime: false,
    }),
    []
  );

  // apiRef will hold the Plyr instance via react-aptor
  const apiRef = useRef<any>(null);
  // usePlyr gives us the ref to put on the video element
  const videoRef = usePlyr(apiRef, { source: plyrSource, options: plyrOptions });

  useEffect(() => {
    // Helper to get the actual plyr instance
    const getPlayer = () => {
      if (!apiRef.current) return null;
      // In some versions of plyr-react, the ref is a getter function
      const api = typeof apiRef.current === 'function' ? apiRef.current() : apiRef.current;
      return api?.plyr;
    };

    const player = getPlayer();

    // Safety check: ensure player exists and has event methods
    if (!player || typeof player.on !== 'function') return;

    const handleTimeUpdate = () => {
      if (onProgress && player.duration > 0) {
        onProgress((player.currentTime / player.duration) * 100);
      }
    };

    const handleEnded = () => {
      if (onComplete) onComplete();
    };

    player.on('timeupdate', handleTimeUpdate);
    player.on('ended', handleEnded);

    return () => {
      if (typeof player.off === 'function') {
        player.off('timeupdate', handleTimeUpdate);
        player.off('ended', handleEnded);
      }
    };
  }, [onProgress, onComplete, videoUrl]); // Re-run when video source changes

  return (
    <div className="group relative aspect-video min-h-[360px] overflow-hidden rounded-xl bg-black shadow-2xl">
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-lg">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
          <span>LIVE</span>
        </div>
      )}

      {/* Video Element for usePlyr hook */}
      <div className="h-full w-full">
        <video ref={videoRef} className="plyr-react plyr" crossOrigin="anonymous" />
      </div>

      <style jsx global>{`
        .plyr--full-ui.plyr--video {
          --plyr-color-main: #10b981; /* emerald-500 */
          --plyr-video-background: #000;
          height: 100%;
        }
        .plyr__video-wrapper {
          overflow: hidden;
          border-radius: 0.75rem;
          height: 100% !important;
          aspect-ratio: 16/9;
        }
        .plyr--video {
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};
