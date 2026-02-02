"use client";
import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, RefreshCw, Loader2, Send } from 'lucide-react';
import { SEO } from '@components/SEO/SEO';
import { useAuth } from '@context/AuthContext';
import { communityService, Post, Comment } from '@student/services/communityService';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Separator } from '@shared/components/ui/separator';

export const CommunityPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Comments state
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
    const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
    const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const fetchedPosts = await communityService.getPosts();
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

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
            await loadPosts(); // Refresh list
        } catch (error) {
            console.error("Failed to create post", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (id: string, currentLikes: number) => {
        // Optimistic update
        setPosts(posts.map(p => p.id === id ? { ...p, likes: currentLikes + 1 } : p));
        try {
            await communityService.likePost(id);
        } catch (error) {
            console.error("Failed to like post", error);
            // Revert on error
            setPosts(posts.map(p => p.id === id ? { ...p, likes: currentLikes } : p));
        }
    };

    const toggleComments = async (postId: string) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            return;
        }

        setExpandedPostId(postId);

        // Fetch comments if not already cached/loaded
        if (!comments[postId]) {
            setLoadingComments(prev => ({ ...prev, [postId]: true }));
            try {
                const fetchedComments = await communityService.getComments(postId);
                setComments(prev => ({ ...prev, [postId]: fetchedComments }));
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setLoadingComments(prev => ({ ...prev, [postId]: false }));
            }
        }
    };

    const handleCommentSubmit = async (postId: string) => {
        const content = newCommentContent[postId];
        if (!content?.trim()) return;

        setSubmittingComment(prev => ({ ...prev, [postId]: true }));
        try {
            await communityService.addComment(
                postId,
                content,
                user?.name || 'Student',
                user?.role === 'teacher' ? 'Instructor' : 'Student'
            );

            // Refresh comments
            const fetchedComments = await communityService.getComments(postId);
            setComments(prev => ({ ...prev, [postId]: fetchedComments }));
            setNewCommentContent(prev => ({ ...prev, [postId]: '' }));

            // Increment comment count locally
            setPosts(posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
        } catch (error) {
            console.error("Failed to submit comment", error);
        } finally {
            setSubmittingComment(prev => ({ ...prev, [postId]: false }));
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            <SEO
                title="Community Discussion"
                description="Connect with fellow students and instructors. Share knowledge, ask questions, and collaborate."
            />

            <div className="container max-w-5xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Community Discussion</h1>
                        <p className="text-muted-foreground mt-1">Join the conversation with your peers.</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={loadPosts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
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
                                                className="min-h-[100px] resize-none"
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
                        {loading && posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                                <p>Loading discussions...</p>
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map(post => {
                                let timeAgo = 'Just now';
                                try {
                                    timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
                                } catch (e) {
                                    timeAgo = post.timestamp;
                                }

                                const isExpanded = expandedPostId === post.id;

                                return (
                                    <Card key={post.id} className="transition-all hover:shadow-md">
                                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{post.author.name}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        {post.author.role}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <p className="leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                        </CardContent>
                                        <CardFooter className="pt-2 flex-col items-stretch space-y-4">
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleLike(post.id, post.likes)}
                                                    className="gap-2 hover:text-primary"
                                                >
                                                    <ThumbsUp className="h-4 w-4" />
                                                    {post.likes > 0 && <span>{post.likes}</span>}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`gap-2 hover:text-primary ${isExpanded ? 'text-primary bg-primary/10' : ''}`}
                                                    onClick={() => toggleComments(post.id)}
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                    {post.comments > 0 ? <span>{post.comments} Comments</span> : <span>Reply</span>}
                                                </Button>
                                            </div>

                                            {/* Comments Section */}
                                            {isExpanded && (
                                                <div className="pt-4 border-t w-full animate-in slide-in-from-top-2 duration-200">
                                                    {/* Existing Comments */}
                                                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                                                        {loadingComments[post.id] ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                            </div>
                                                        ) : comments[post.id]?.length > 0 ? (
                                                            comments[post.id].map(comment => {
                                                                let commentTimeAgo = 'Just now';
                                                                try {
                                                                    commentTimeAgo = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });
                                                                } catch (e) { }

                                                                return (
                                                                    <div key={comment.id} className="flex gap-3 text-sm">
                                                                        <Avatar className="h-8 w-8 mt-1">
                                                                            <AvatarFallback className="text-xs">{getInitials(comment.author.name)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 bg-muted/40 p-3 rounded-lg">
                                                                            <div className="flex items-baseline justify-between mb-1">
                                                                                <span className="font-semibold text-xs">{comment.author.name}</span>
                                                                                <span className="text-[10px] text-muted-foreground">{commentTimeAgo}</span>
                                                                            </div>
                                                                            <p className="text-foreground/90">{comment.content}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-center text-sm text-muted-foreground py-2">No comments yet. Be the first to reply!</p>
                                                        )}
                                                    </div>

                                                    {/* Add Comment Input */}
                                                    <div className="flex gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{getInitials(user?.name || 'Me')}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 flex gap-2">
                                                            <Textarea
                                                                placeholder="Write a reply..."
                                                                className="min-h-[40px] h-[40px] resize-none py-2"
                                                                value={newCommentContent[post.id] || ''}
                                                                onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-10 w-10 shrink-0"
                                                                disabled={!newCommentContent[post.id]?.trim() || submittingComment[post.id]}
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
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
                                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                                <p>No posts yet. Be the first to start a discussion!</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Trending Topics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {['#General', '#Homework', '#Labs', '#Career', '#News'].map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Community Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>1. Be respectful to others.</p>
                                <p>2. Keep discussions relevant to the course.</p>
                                <p>3. Do not share solutions to graded exams.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
