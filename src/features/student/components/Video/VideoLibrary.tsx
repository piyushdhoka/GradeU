import React, { useState, useEffect } from 'react';
import {
  Play,
  Search,
  Film,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  List,
  Shield,
  Database,
  Globe,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { fetchVideosFromImageKit, type ImageKitVideo } from '@services/imagekitService';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { cn } from '@lib/utils';
import { Skeleton } from '@components/ui/skeleton';

export const VideoLibrary: React.FC = () => {
  type ViewMode = 'grid' | 'list';
  type ExtendedVideo = ImageKitVideo & { source: 'VU' | 'General' };

  const [allVideos, setAllVideos] = useState<ExtendedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedVideo, setSelectedVideo] = useState<ImageKitVideo | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vuFetched, othersFetched] = await Promise.all([
        fetchVideosFromImageKit('/VU'),
        fetchVideosFromImageKit('/gradeu'),
      ]);

      const merged: ExtendedVideo[] = [
        ...vuFetched.map((v) => ({ ...v, source: 'VU' as const })),
        ...othersFetched.map((v) => ({ ...v, source: 'General' as const })),
      ];
      setAllVideos(merged);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError('Failed to load videos. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(allVideos.map((v) => v.category)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filterVideos = (videoList: ExtendedVideo[]) => {
    return videoList.filter((video) => {
      const s = searchTerm.trim().toLowerCase();
      const matchesSearch =
        s === '' ||
        video.title.toLowerCase().includes(s) ||
        video.description.toLowerCase().includes(s);
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === 'all' || video.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  };

  const getDisplayVideos = () => {
    if (activeTab === 'vu') return filterVideos(allVideos.filter((v) => v.source === 'VU'));
    if (activeTab === 'external')
      return filterVideos(allVideos.filter((v) => v.source === 'General'));
    return filterVideos(allVideos);
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'advanced':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const DEFAULT_PLACEHOLDER = '/video-placeholder.png';

  const tabs = [
    { id: 'all', label: 'All Lessons', icon: Database },
    { id: 'vu', label: 'University', icon: Shield },
    { id: 'external', label: 'GradeU', icon: Globe },
  ];

  // Video Grid/List Renderer
  const VideoGrid = ({ videos }: { videos: ExtendedVideo[] }) => {
    if (videos.length === 0) {
      return (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Lessons Found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div
        className={cn(
          'animate-in fade-in grid gap-4 duration-500',
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        )}
      >
        {videos.map((video) => (
          <Card
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className={cn(
              'group cursor-pointer overflow-hidden transition-all duration-200',
              'border-border/50 hover:border-primary/30 hover:shadow-primary/5 hover:shadow-lg',
              viewMode === 'list' && 'flex flex-row',
              video.source === 'VU' && 'border-indigo-500/20'
            )}
          >
            {/* Thumbnail */}
            <div
              className={cn(
                'bg-muted relative overflow-hidden',
                viewMode === 'grid' ? 'aspect-video w-full' : 'h-24 w-40 shrink-0'
              )}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                onError={(e) => ((e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER)}
              />
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent" />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="bg-primary/90 flex h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm">
                  <Play className="text-primary-foreground ml-0.5 h-5 w-5 fill-current" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                {video.duration}
              </div>

              {/* VU Badge */}
              {video.source === 'VU' && viewMode === 'grid' && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-indigo-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  <Shield className="h-2.5 w-2.5" /> VU
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className={cn(
                'flex-1',
                viewMode === 'grid' ? 'p-4' : 'flex flex-col justify-center p-4'
              )}
            >
              <div className="mb-2 flex items-start gap-2">
                {viewMode === 'list' && video.source === 'VU' && (
                  <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400">
                    VU
                  </span>
                )}
                <h3
                  className={cn(
                    'group-hover:text-primary line-clamp-2 font-semibold transition-colors',
                    viewMode === 'list' ? 'text-base' : 'text-sm'
                  )}
                >
                  {video.title}
                </h3>
              </div>

              {viewMode === 'list' && (
                <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
                  {video.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                    getDifficultyVariant(video.difficulty)
                  )}
                >
                  {video.difficulty}
                </span>
                <span className="text-muted-foreground text-[10px]">{video.category}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Video Player View
  if (selectedVideo) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedVideo(null)}
          className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>

        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <VideoPlayer
              videoUrl={selectedVideo.videoUrl}
              title={selectedVideo.title}
              onProgress={() => {}}
              onComplete={() => {}}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{selectedVideo.title}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase',
                    getDifficultyVariant(selectedVideo.difficulty)
                  )}
                >
                  {selectedVideo.difficulty}
                </span>
                <span className="bg-muted border-border text-muted-foreground rounded-full border px-2.5 py-1 text-xs">
                  {selectedVideo.category}
                </span>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedVideo.duration}
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="max-w-3xl text-base">
            {selectedVideo.description}
          </CardDescription>
        </div>
      </div>
    );
  }

  // Main Library View
  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Lesson Library</h1>
          <p className="text-muted-foreground">Training resources and educational content</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-card border-border/50 flex items-center gap-2 rounded-lg border px-4 py-2">
            <Film className="text-primary h-5 w-5" />
            <span className="text-sm font-medium">{allVideos.length} Lessons</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadVideos}
            className="h-10 w-10"
            title="Refresh Lessons"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        {/* Tab Buttons */}
        <div className="bg-card border-border/50 flex flex-wrap gap-2 rounded-lg border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? tab.id === 'vu'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d} value={d} className="capitalize">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="bg-card border-border/50 flex gap-1 rounded-lg border p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', viewMode === 'grid' && 'bg-muted')}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', viewMode === 'list' && 'bg-muted')}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="border-border/50 overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="text-destructive mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">Failed to Load Lessons</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadVideos} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <VideoGrid videos={getDisplayVideos()} />
        )}
      </div>
    </div>
  );
};

export default VideoLibrary;
