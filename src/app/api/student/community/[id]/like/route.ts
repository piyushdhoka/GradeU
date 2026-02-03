import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

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

// LIKE a post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { id } = await params;
    const result = await redis.hincrby(`post:${id}`, 'likes', 1);
    return NextResponse.json({ success: true, likes: result });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
