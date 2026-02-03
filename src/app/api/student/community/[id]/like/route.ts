import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import {
  authenticateRequest,
  unauthorizedResponse,
  rateLimit,
  rateLimitResponse,
} from '../../middleware';

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

// TOGGLE like on a post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Rate limiting
    if (!rateLimit(`like:${auth.userId}`, 30, 60000)) {
      return rateLimitResponse();
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { id } = await params;
    const userId = auth.userId;

    // Check if user already liked this post
    const hasLiked = await redis.sismember(`post:${id}:likedBy`, userId);

    if (hasLiked) {
      // Unlike: remove user from set and decrement count
      await redis.srem(`post:${id}:likedBy`, userId);
      await redis.hincrby(`post:${id}`, 'likes', -1);
      const newLikes = await redis.hget(`post:${id}`, 'likes');
      return NextResponse.json({
        success: true,
        likes: parseInt(String(newLikes || '0')),
        liked: false,
      });
    } else {
      // Like: add user to set and increment count
      await redis.sadd(`post:${id}:likedBy`, userId);
      await redis.hincrby(`post:${id}`, 'likes', 1);
      const newLikes = await redis.hget(`post:${id}`, 'likes');
      return NextResponse.json({
        success: true,
        likes: parseInt(String(newLikes || '0')),
        liked: true,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
