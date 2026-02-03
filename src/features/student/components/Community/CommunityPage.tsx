'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  RefreshCw,
  Loader2,
  Send,
  AlertCircle,
  Search,
  Trash2,
  Edit3,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { communityService, Post, Comment, PostsResponse } from '@student/services/communityService';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { Input } from '@shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { toast } from 'sonner';

export const CommunityPage: React.FC<{ onBackAction: () => void }> = ({ onBackAction }) => {
  const { user } = useAuth();

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'mostLiked' | 'mostCommented'>('newest');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPosts = useCallback(
    async (pageNumber = 1) => {
      try {
        setLoading(true);
        setServiceUnavailable(false);
        const response: PostsResponse = await communityService.getPosts(
          user?.id,
          pageNumber,
          pagination.limit,
          sortBy,
          debouncedSearch
        );

        setPosts(response.posts);
        setPagination((prev) => ({
          ...prev,
          total: response.total,
          totalPages: response.totalPages,
          page: response.page,
        }));
      } catch (error: any) {
        console.error('Failed to load posts', error);
        if (error.response?.status === 503) {
          setServiceUnavailable(true);
          toast.error('Community service is currently unavailable');
        } else {
          toast.error('Failed to load community posts');
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id, pagination.limit, sortBy, debouncedSearch]
  );

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      setSubmitting(true);
      await communityService.createPost(
        newPostContent,
        user?.name || 'Student',
        user?.role === 'teacher' ? 'Instructor' : 'Student'
      );
      setNewPostContent('');
      toast.success('Post created successfully!');
      loadPosts(1);
    } catch (error: any) {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      await communityService.updatePost(postId, editContent);
      setPosts(posts.map((p) => (p.id === postId ? { ...p, content: editContent } : p)));
      setEditingPostId(null);
      toast.success('Post updated');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await communityService.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleLike = async (id: string) => {
    if (!user?.id) {
      toast.error('Please log in to like posts');
      return;
    }

    const post = posts.find((p) => p.id === id);
    if (!post) return;

    // Optimistic update
    const newLiked = !post.likedByUser;
    const newLikes = post.likes + (newLiked ? 1 : -1);
    setPosts(
      posts.map((p) => (p.id === id ? { ...p, likes: newLikes, likedByUser: newLiked } : p))
    );

    try {
      await communityService.toggleLike(id);
    } catch (error: any) {
      setPosts(
        posts.map((p) =>
          p.id === id ? { ...p, likes: post.likes, likedByUser: post.likedByUser } : p
        )
      );
      toast.error('Failed to update like');
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);

    if (!comments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const fetchedComments = await communityService.getComments(postId);
        setComments((prev) => ({ ...prev, [postId]: fetchedComments }));
      } catch (error: any) {
        toast.error('Failed to load comments');
        setExpandedPostId(null);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = newCommentContent[postId];
    if (!content?.trim()) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      await communityService.addComment(
        postId,
        content,
        user?.name || 'Student',
        user?.role === 'teacher' ? 'Instructor' : 'Student'
      );

      const fetchedComments = await communityService.getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: fetchedComments }));
      setNewCommentContent((prev) => ({ ...prev, [postId]: '' }));

      setPosts(posts.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-background text-foreground animate-in fade-in min-h-screen duration-500">
      <div className="container mx-auto max-w-5xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community Discussion</h1>
            <p className="text-muted-foreground mt-1">Join the conversation with your peers.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:w-60"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-35">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="mostLiked">Most Liked</SelectItem>
                <SelectItem value="mostCommented">Discussed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadPosts(pagination.page)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Create Post Section */}
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handlePostSubmit}>
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback>{getInitials(user?.name || 'Student')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <Textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="min-h-25 resize-none"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={!newPostContent.trim() || submitting}>
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Send className="mr-2 h-4 w-4" />
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Posts List */}
            {serviceUnavailable ? (
              <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="text-destructive mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold">Service Unavailable</h3>
                  <p className="text-muted-foreground mb-4 text-center text-sm">
                    The community feature is temporarily unavailable.
                  </p>
                  <Button onClick={() => loadPosts(pagination.page)} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : loading && posts.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : posts.length > 0 ? (
              <>
                {posts.map((post) => {
                  const isAuthor = user?.id === post.userId;
                  const isEditing = editingPostId === post.id;
                  let timeAgo = 'Just now';
                  try {
                    timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
                  } catch (e) {
                    timeAgo = post.timestamp;
                  }

                  const isExpanded = expandedPostId === post.id;

                  return (
                    <Card key={post.id} className="transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{post.author.name}</span>
                              <Badge variant="secondary" className="h-5 text-[10px]">
                                {post.author.role}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground text-xs">{timeAgo}</span>
                          </div>
                        </div>
                        {isAuthor && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditContent(post.content);
                                }}
                              >
                                <Edit3 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardHeader>
                      <CardContent className="pb-2">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-20"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingPostId(null)}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleEditPost(post.id)}>
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex-col items-stretch space-y-4 pt-2">
                        <div className="text-muted-foreground flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className={`gap-2 transition-colors ${
                              post.likedByUser
                                ? 'text-primary hover:text-primary/80'
                                : 'hover:text-primary'
                            }`}
                          >
                            <ThumbsUp
                              className={`h-4 w-4 ${post.likedByUser ? 'fill-current' : ''}`}
                            />
                            {post.likes > 0 && <span>{post.likes}</span>}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`hover:text-primary gap-2 ${isExpanded ? 'text-primary bg-primary/10' : ''}`}
                            onClick={() => toggleComments(post.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            {post.comments > 0 ? (
                              <span>{post.comments} Comments</span>
                            ) : (
                              <span>Reply</span>
                            )}
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 w-full border-t pt-4 duration-200">
                            {/* Existing Comments */}
                            <div className="mb-6 max-h-100 space-y-4 overflow-y-auto pr-2">
                              {loadingComments[post.id] ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                                </div>
                              ) : comments[post.id]?.length > 0 ? (
                                comments[post.id].map((comment) => {
                                  let commentTimeAgo = 'Just now';
                                  try {
                                    commentTimeAgo = formatDistanceToNow(
                                      new Date(comment.timestamp),
                                      { addSuffix: true }
                                    );
                                  } catch (e) {}

                                  return (
                                    <div key={comment.id} className="flex gap-3 text-sm">
                                      <Avatar className="mt-1 h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(comment.author.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="bg-muted/40 flex-1 rounded-lg p-3">
                                        <div className="mb-1 flex items-baseline justify-between">
                                          <span className="text-xs font-semibold">
                                            {comment.author.name}
                                          </span>
                                          <span className="text-muted-foreground text-[10px]">
                                            {commentTimeAgo}
                                          </span>
                                        </div>
                                        <p className="text-foreground/90">{comment.content}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-muted-foreground py-2 text-center text-sm">
                                  No comments yet. Be the first to reply!
                                </p>
                              )}
                            </div>

                            {/* Add Comment Input */}
                            <div className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{getInitials(user?.name || 'Me')}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-1 gap-2">
                                <Textarea
                                  placeholder="Write a reply..."
                                  className="h-10 min-h-10 resize-none py-2"
                                  value={newCommentContent[post.id] || ''}
                                  onChange={(e) =>
                                    setNewCommentContent((prev) => ({
                                      ...prev,
                                      [post.id]: e.target.value,
                                    }))
                                  }
                                />
                                <Button
                                  size="icon"
                                  className="h-10 w-10 shrink-0"
                                  disabled={
                                    !newCommentContent[post.id]?.trim() ||
                                    submittingComment[post.id]
                                  }
                                  onClick={() => handleCommentSubmit(post.id)}
                                >
                                  {submittingComment[post.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 py-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => loadPosts(pagination.page - 1)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || loading}
                      onClick={() => loadPosts(pagination.page + 1)}
                    >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                <p>No posts found. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['#General', '#Homework', '#Labs', '#Career', '#News'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4 text-sm">
                <p>• Be respectful and helpful to others.</p>
                <p>• Share knowledge and resources related to cybersecurity.</p>
                <p>• Avoid spamming or unrelated content.</p>
                <p>• Report any inappropriate behavior.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                    <AlertCircle className="text-primary h-6 w-6" />
                  </div>
                  <h4 className="mb-2 font-semibold">Join Study Groups</h4>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Connect with students working on the same labs and courses.
                  </p>
                  <Button className="w-full" variant="outline" size="sm">
                    Find Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
