import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('URL:', url);
console.log('Token Length:', token?.length);

const redis = new Redis({
    url: url!,
    token: token!,
});

async function test() {
    try {
        console.log('Pinging Redis...');
        const response = await redis.ping();
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
