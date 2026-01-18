import IORedis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const redisUrl = process.env.REDIS_URL;
console.log('Testing Redis URL:', redisUrl?.substring(0, 10) + '...');

if (!redisUrl) {
    console.error('No REDIS_URL found');
    process.exit(1);
}

const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
});

redis.on('connect', () => {
    console.log('Connected to Redis!');
    redis.quit();
});

redis.on('error', (err) => {
    console.error('Redis Error:', err);
    process.exit(1);
});
