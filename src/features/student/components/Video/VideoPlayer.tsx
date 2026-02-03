import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  isLive?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const getYouTubeEmbedUrl = (url: string): string => {
  // Convert YouTube watch URLs to embed URLs
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isYouTube = isYouTubeUrl(videoUrl);
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(videoUrl) : videoUrl;

  useEffect(() => {
    if (isYouTube) return; // Skip for YouTube videos as they handle their own events

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress) {
        onProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onProgress, onComplete, isYouTube]);

  const togglePlay = () => {
    if (isYouTube) return; // YouTube iframe handles its own controls

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isYouTube) return; // YouTube iframe handles its own seeking

    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (isYouTube) return; // YouTube iframe handles its own audio

    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isYouTube) return; // YouTube iframe handles its own volume

    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipTime = (seconds: number) => {
    if (isYouTube) return; // YouTube iframe handles its own seeking

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    if (isYouTube) return; // YouTube iframe handles its own playback rate

    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    if (isYouTube) return; // YouTube has its own controls

    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video min-h-[360px] overflow-hidden rounded-lg bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
          <span>LIVE</span>
        </div>
      )}

      {/* Video Element */}
      {isYouTube ? (
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full"
          src={videoUrl}
          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDgwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMUYyOTM3Ii8+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjIyNSIgcj0iNDAiIGZpbGw9IiMwNkI2RDQiLz4KPHN2ZyB4PSIzODUiIHk9IjIxMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHA+PHBhdGggZD0ibTcgNCA5IDUuNS05IDUuNVY0eiIvPjwvcGF0aD4KPC9zdmc+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTRBM0I4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkN5YmVyU2VjIFZpZGVvIExlY3R1cmU8L3RleHQ+Cjwvc3ZnPgo="
          onClick={togglePlay}
        />
      )}

      {/* Controls Overlay */}
      {!isYouTube && (
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Play/Pause Button (Center) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="transform rounded-full bg-black/50 p-4 text-white transition-all duration-200 hover:scale-110 hover:bg-black/70"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute right-0 bottom-0 left-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div
                className="h-2 w-full cursor-pointer rounded-full bg-white/30 transition-all hover:h-3"
                onClick={handleSeek}
              >
                <div
                  className="relative h-full rounded-full bg-orange-500"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute top-1/2 right-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-orange-500 opacity-0 transition-opacity hover:opacity-100"></div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white transition-colors hover:text-orange-400"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>

                {/* Skip Buttons */}
                <button
                  onClick={() => skipTime(-10)}
                  className="text-white transition-colors hover:text-orange-400"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={() => skipTime(10)}
                  className="text-white transition-colors hover:text-orange-400"
                >
                  <SkipForward className="h-5 w-5" />
                </button>

                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-white transition-colors hover:text-orange-400"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30"
                  />
                </div>

                {/* Time Display */}
                <div className="text-sm text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Playback Speed */}
                <div className="group relative">
                  <button className="flex items-center space-x-1 text-white transition-colors hover:text-orange-400">
                    <Settings className="h-5 w-5" />
                    <span className="text-sm">{playbackRate}x</span>
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 rounded-lg bg-black/90 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full rounded px-3 py-1 text-left text-sm transition-colors hover:bg-white/20 ${
                          playbackRate === rate ? 'text-orange-400' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white transition-colors hover:text-orange-400"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Title */}
      <div
        className={`absolute top-4 right-4 left-4 transition-opacity duration-300 ${
          showControls || isYouTube ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
    </div>
  );
};
