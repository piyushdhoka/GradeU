import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
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

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!redis) {
      return NextResponse.json([]);
    }

    const { id } = await params;
    const commentIds = await redis.lrange(`post:${id}:comments`, 0, -1);

    if (commentIds.length === 0) {
      return NextResponse.json([]);
    }

    const comments = await Promise.all(
      commentIds.map(async (commentId) => {
        const comment = await redis.hgetall(`comment:${commentId}`);
        if (!comment) return null;
        return {
          ...comment,
          author: safeParse(comment.author, { name: 'Unknown' })
        };
      })
    );

    return NextResponse.json(comments.filter(c => c !== null));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json([]);
  }
}

// ADD a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { id: postId } = await params;
    const { author, content } = await request.json();
    const commentId = uuidv4();
    const timestamp = new Date().toISOString();

    const commentData = {
      id: commentId,
      postId,
      author: JSON.stringify(author),
      content,
      timestamp
    };

    // Save comment and update post comment count
    await redis.hset(`comment:${commentId}`, commentData);
    await redis.lpush(`post:${postId}:comments`, commentId);
    await redis.hincrby(`post:${postId}`, 'comments', 1);

    return NextResponse.json({ success: true, id: commentId }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
