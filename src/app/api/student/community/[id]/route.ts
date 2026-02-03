import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { authenticateRequest, unauthorizedResponse } from '../middleware';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const safeParse = (data: any, fallback: any) => {
  if (!data) return fallback;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return fallback;
  }
};

// DELETE a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { id } = await params;

    // Get post to check ownership
    const post = await redis.hgetall(`post:${id}`);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user owns this post
    if (post.userId !== auth.userId) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    // Delete post, its likes, and comments
    await redis.del(`post:${id}`);
    await redis.del(`post:${id}:likedBy`);
    await redis.lrem('community:timeline', 1, id);

    // Delete all comments
    const commentIds = await redis.lrange(`post:${id}:comments`, 0, -1);
    for (const commentId of commentIds) {
      await redis.del(`comment:${commentId}`);
    }
    await redis.del(`post:${id}:comments`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

// EDIT/UPDATE a post
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Get post to check ownership
    const post = await redis.hgetall(`post:${id}`);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user owns this post
    if (post.userId !== auth.userId) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 });
    }

    // Update post content and add edited flag
    await redis.hset(`post:${id}`, {
      content,
      edited: 'true',
      editedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
