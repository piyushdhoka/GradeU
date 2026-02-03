import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { authenticateRequest, unauthorizedResponse } from '../../../middleware';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// DELETE a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { id: postId, commentId } = await params;

    // Get comment to check ownership
    const comment = await redis.hgetall(`comment:${commentId}`);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user owns this comment
    if (comment.userId !== auth.userId) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Delete comment and decrement post comment count
    await redis.del(`comment:${commentId}`);
    await redis.lrem(`post:${postId}:comments`, 1, commentId);
    await redis.hincrby(`post:${postId}`, 'comments', -1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}

// EDIT a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { commentId } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Get comment to check ownership
    const comment = await redis.hgetall(`comment:${commentId}`);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user owns this comment
    if (comment.userId !== auth.userId) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    // Update comment
    await redis.hset(`comment:${commentId}`, {
      content,
      edited: 'true',
      editedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
