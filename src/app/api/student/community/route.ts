import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import {
  authenticateRequest,
  unauthorizedResponse,
  rateLimit,
  rateLimitResponse,
} from './middleware';

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

// GET all posts with pagination, sorting, and search
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 60, 60000)) {
      return rateLimitResponse();
    }

    if (!redis) {
      return NextResponse.json(
        { error: 'Community service is not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, mostLiked, mostCommented
    const search = searchParams.get('search') || '';

    // Get all post IDs from timeline
    const postIds = await redis.lrange('community:timeline', 0, -1);

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0, page, totalPages: 0 });
    }

    // Fetch all posts
    const results = await Promise.all(
      postIds.map(async (id) => {
        const post = await redis.hgetall(`post:${id}`);
        if (!post) return null;

        // Check if current user has liked this post
        let likedByUser = false;
        if (userId) {
          const isMember = await redis.sismember(`post:${id}:likedBy`, userId);
          likedByUser = isMember === 1;
        }

        return {
          ...post,
          tags: safeParse(post.tags, []),
          likes: parseInt(String(post.likes || '0')),
          comments: parseInt(String(post.comments || '0')),
          author: safeParse(post.author, { name: 'Unknown', role: 'Student' }),
          likedByUser,
          content: String(post.content || ''),
          timestamp: String(post.timestamp || ''),
        };
      })
    );

    // Filter out null values and ensure type safety
    let posts = results.filter((p): p is NonNullable<typeof p> => p !== null);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(searchLower) ||
          p.author.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort posts
    posts.sort((a, b) => {
      switch (sortBy) {
        case 'mostLiked':
          return (b.likes || 0) - (a.likes || 0);
        case 'mostCommented':
          return (b.comments || 0) - (a.comments || 0);
        case 'newest':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

    // Pagination
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPosts = posts.slice(start, end);

    return NextResponse.json({
      posts: paginatedPosts,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// CREATE a post
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Rate limiting - 5 posts per minute
    if (!rateLimit(`post:${auth.userId}`, 5, 60000)) {
      return rateLimitResponse();
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { author, content, tags } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      );
    }

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
      userId: auth.userId, // Store creator's userId for permissions
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
