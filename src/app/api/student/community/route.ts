import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

// Initialize Redis only if credentials are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Helper to safely parse JSON
const safeParse = (data: any, fallback: any) => {
  if (!data) return fallback;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return fallback;
  }
};

// GET all posts
export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json([]);
    }

    // Get all post IDs from timeline
    const postIds = await redis.lrange('community:timeline', 0, -1);

    if (postIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all posts
    const posts = await Promise.all(
      postIds.map(async (id) => {
        const post = await redis.hgetall(`post:${id}`);
        if (!post) return null;
        return {
          ...post,
          tags: safeParse(post.tags, []),
          likes: parseInt(String(post.likes || '0')),
          comments: parseInt(String(post.comments || '0')),
          author: safeParse(post.author, { name: 'Unknown', role: 'Student' }),
        };
      })
    );

    return NextResponse.json(posts.filter((p) => p !== null));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json([]);
  }
}

// CREATE a post
export async function POST(request: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { author, content, tags } = await request.json();
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const postData = {
      id,
      author: JSON.stringify(author),
      content,
      likes: '0',
      comments: '0',
      timestamp,
      tags: JSON.stringify(tags || []),
    };

    // Save post data and add to timeline
    await redis.hset(`post:${id}`, postData);
    await redis.lpush('community:timeline', id);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
