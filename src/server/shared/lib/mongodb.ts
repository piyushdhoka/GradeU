import mongoose from 'mongoose';
import { logger } from './logger.js';

let isConnected = false;

const connectDB = async (): Promise<void> => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.mongo_api;

        if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
            const error = new Error('MongoDB URI not found in environment variables. Set MONGODB_URI, MONGODB_URL, or mongo_api');
            logger.error('MongoDB Connection Error', error);
            throw error;
        }

        const conn = await mongoose.connect(uri.trim());
        isConnected = true;
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            isConnected = false;
        });
    } catch (error) {
        isConnected = false;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('MongoDB Connection Error', err);
        // In production, you might want to exit, but for dev we'll let it continue
        // and let endpoints handle the error gracefully
        throw error;
    }
};

export const checkMongoConnection = (): boolean => {
    return isConnected && mongoose.connection.readyState === 1;
};

export default connectDB;
