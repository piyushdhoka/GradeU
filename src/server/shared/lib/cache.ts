import { logger } from './logger.js';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

/**
 * Simple in-memory cache that can be upgraded to Redis later
 * For distributed storage, Redis should be used in production
 */
class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

    /**
     * Get a value from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttl?: number): void {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            data: value,
            expiresAt
        });
    }

    /**
     * Delete a value from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Clear expired entries (should be called periodically)
     */
    clearExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const cache = new CacheService();

// Clean up expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        cache.clearExpired();
    }, 10 * 60 * 1000);
}

/**
 * Cache key generators for common resources
 */
export const CacheKeys = {
    course: (courseId: string) => `course:${courseId}`,
    courseList: () => 'courses:list',
    moduleProgress: (studentId: string, courseId: string, moduleId: string) => 
        `progress:${studentId}:${courseId}:${moduleId}`,
    courseProgress: (studentId: string, courseId: string) => 
        `progress:${studentId}:${courseId}`,
    experience: (studentId: string, courseId: string, moduleId: string) =>
        `experience:${studentId}:${courseId}:${moduleId}`
};

/**
 * Redis cache adapter (for future use)
 * Uncomment and configure when Redis is available
 */
/*
import Redis from 'ioredis';

class RedisCacheService {
    private client: Redis;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = new Redis(redisUrl);
        
        this.client.on('error', (err) => {
            logger.error('Redis connection error', err);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Redis get error', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, Math.floor(ttl / 1000), serialized);
            } else {
                await this.client.set(key, serialized);
            }
        } catch (error) {
            logger.error('Redis set error', error instanceof Error ? error : new Error(String(error)));
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Redis delete error', error instanceof Error ? error : new Error(String(error)));
        }
    }

    async clear(): Promise<void> {
        try {
            await this.client.flushdb();
        } catch (error) {
            logger.error('Redis clear error', error instanceof Error ? error : new Error(String(error)));
        }
    }
}

// Use Redis if available, otherwise fall back to in-memory cache
export const cache = process.env.REDIS_URL 
    ? new RedisCacheService() 
    : new CacheService();
*/
