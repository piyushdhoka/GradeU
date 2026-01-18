import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('Warning: REDIS_URL not found in environment variables.');
} else {
    console.log(`[Queue] Initializing Redis connection to: ${redisUrl.substring(0, 15)}...`);
}

export const redisConnection = new IORedis(redisUrl!, {
    maxRetriesPerRequest: null,
    family: 4, // Force IPv4 to avoid EPERM/ECONNREFUSED on some Windows setups
});

export const courseQueue = new Queue('course-generation', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
