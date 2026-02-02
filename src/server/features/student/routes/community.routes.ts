import { Router } from 'express';
import redis from '../../../shared/lib/redis.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to safely parse JSON
const safeParse = (data: any, fallback: any) => {
    if (!data) return fallback;
    try {
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        console.warn('Failed to parse JSON:', data);
        return fallback;
    }
};

// GET all posts
router.get('/', async (req, res) => {
    try {
        // Get all post IDs from timeline
        const postIds = await redis.lrange('community:timeline', 0, -1);

        if (postIds.length === 0) {
            return res.json([]);
        }

        // Fetch all posts in parallel
        // Using a pipeline for better performance
        const pipeline = redis.pipeline();
        postIds.forEach((id) => pipeline.hgetall(`post:${id}`));
        const posts = await pipeline.exec();

        // Format posts
        const formattedPosts = posts
            .map((post: any) => {
                if (!post) return null;
                return {
                    ...post,
                    tags: safeParse(post.tags, []),
                    likes: parseInt(post.likes || '0'),
                    comments: parseInt(post.comments || '0'),
                    author: safeParse(post.author, { name: 'Unknown', role: 'Student' })
                };
            })
            .filter((p: any) => p !== null);

        res.json(formattedPosts);
    } catch (error) {
        console.error('SERVER ERROR fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts', details: String(error) });
    }
});

// CREATE a post
router.post('/', async (req, res) => {
    try {
        const { author, content, tags } = req.body;
        const id = uuidv4();
        const timestamp = new Date().toISOString();

        const postData = {
            id,
            author: JSON.stringify(author),
            content,
            likes: 0,
            comments: 0,
            timestamp,
            tags: JSON.stringify(tags || [])
        };

        // Transaction: Save post data and add to timeline
        const pipeline = redis.pipeline();
        pipeline.hset(`post:${id}`, postData);
        pipeline.lpush('community:timeline', id);
        await pipeline.exec();

        res.status(201).json({ success: true, id });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// LIKE a post
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await redis.hincrby(`post:${id}`, 'likes', 1);

        res.json({ success: true, likes: result });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// GET comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await redis.lrange(`post:${id}:comments`, 0, -1);

        // Redis stores them as strings (JSON), so parse them
        const formattedComments = comments
            .map((c: any) => safeParse(c, null))
            .filter((c: any) => c !== null);

        res.json(formattedComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// CREATE a comment
router.post('/:id/comments', async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { author, content } = req.body;
        const commentId = uuidv4();
        const timestamp = new Date().toISOString();

        const commentData = {
            id: commentId,
            postId,
            author: {
                name: author.name,
                role: author.role
            },
            content,
            timestamp
        };

        const pipeline = redis.pipeline();
        // Add comment to the list
        pipeline.rpush(`post:${postId}:comments`, JSON.stringify(commentData));
        // Increment comment count on the post
        pipeline.hincrby(`post:${postId}`, 'comments', 1);

        await pipeline.exec();

        res.status(201).json({ success: true, id: commentId });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

export default router;
