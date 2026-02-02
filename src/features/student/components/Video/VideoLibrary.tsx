import React, { useState, useEffect } from 'react';
import { Play, Search, Film, RefreshCw, AlertTriangle, LayoutGrid, List, Shield, Database, Globe, Clock, ArrowLeft } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { fetchVideosFromImageKit, type ImageKitVideo } from '@services/imagekitService';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
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
        fetchVideosFromImageKit('/gradeu')
      ]);

      const merged: ExtendedVideo[] = [
        ...vuFetched.map(v => ({ ...v, source: 'VU' as const })),
        ...othersFetched.map(v => ({ ...v, source: 'General' as const }))
      ];
      setAllVideos(merged);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError('Failed to load videos. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(allVideos.map(v => v.category)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filterVideos = (videoList: ExtendedVideo[]) => {
    return videoList.filter(video => {
      const s = searchTerm.trim().toLowerCase();
      const matchesSearch = s === '' || video.title.toLowerCase().includes(s) || video.description.toLowerCase().includes(s);
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || video.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  };

  const getDisplayVideos = () => {
    if (activeTab === 'vu') return filterVideos(allVideos.filter(v => v.source === 'VU'));
    if (activeTab === 'external') return filterVideos(allVideos.filter(v => v.source === 'General'));
    return filterVideos(allVideos);
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
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
            <Film className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Lessons Found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn(
        "grid gap-4 animate-in fade-in duration-500",
        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      )}>
        {videos.map((video) => (
          <Card
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className={cn(
              "group cursor-pointer transition-all duration-200 overflow-hidden",
              "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
              viewMode === 'list' && "flex flex-row",
              video.source === 'VU' && "border-indigo-500/20"
            )}
          >
            {/* Thumbnail */}
            <div className={cn(
              "relative overflow-hidden bg-muted",
              viewMode === 'grid' ? "aspect-video w-full" : "h-24 w-40 shrink-0"
            )}>
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="h-12 w-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-white">
                {video.duration}
              </div>

              {/* VU Badge */}
              {video.source === 'VU' && viewMode === 'grid' && (
                <div className="absolute top-2 left-2 bg-indigo-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" /> VU
                </div>
              )}
            </div>

            {/* Content */}
            <div className={cn("flex-1", viewMode === 'grid' ? "p-4" : "p-4 flex flex-col justify-center")}>
              <div className="flex items-start gap-2 mb-2">
                {viewMode === 'list' && video.source === 'VU' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    VU
                  </span>
                )}
                <h3 className={cn(
                  "font-semibold line-clamp-2 group-hover:text-primary transition-colors",
                  viewMode === 'list' ? "text-base" : "text-sm"
                )}>
                  {video.title}
                </h3>
              </div>

              {viewMode === 'list' && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{video.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                  getDifficultyVariant(video.difficulty)
                )}>
                  {video.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground">{video.category}</span>
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
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          onClick={() => setSelectedVideo(null)}
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>

        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <VideoPlayer
              videoUrl={selectedVideo.videoUrl}
              title={selectedVideo.title}
              onProgress={() => { }}
              onComplete={() => { }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{selectedVideo.title}</h1>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold uppercase px-2.5 py-1 rounded-full border",
                  getDifficultyVariant(selectedVideo.difficulty)
                )}>
                  {selectedVideo.difficulty}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                  {selectedVideo.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedVideo.duration}
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="text-base max-w-3xl">
            {selectedVideo.description}
          </CardDescription>
        </div>
      </div>
    );
  }

  // Main Library View
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lesson Library</h1>
          <p className="text-muted-foreground">Training resources and educational content</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
            <Film className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{allVideos.length} Lessons</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadVideos}
            className="h-10 w-10"
            title="Refresh Lessons"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 p-1 bg-card rounded-lg border border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? tab.id === 'vu'
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map(d => (
                <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-card rounded-lg border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewMode === 'grid' && "bg-muted")}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewMode === 'list' && "bg-muted")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="border-border/50 overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Lessons</h3>
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