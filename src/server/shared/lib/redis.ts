import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in .env');
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Debug connection
redis.ping().then(() => {
    console.log('✅ Connected to Upstash Redis successfully!');
}).catch((err) => {
    console.error('❌ Failed to connect to Upstash Redis:', err);
    console.log('URL Length:', process.env.UPSTASH_REDIS_REST_URL?.length);
    console.log('Token Length:', process.env.UPSTASH_REDIS_REST_TOKEN?.length);
});

export default redis;
