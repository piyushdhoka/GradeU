import express from 'express';
import axios from 'axios';
import { logger } from '../shared/lib/logger.js';

const router = express.Router();

router.get('/videos', async (req, res) => {
    try {
        const folder = (req.query.folder as string) || '/gradeu';
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

        if (!privateKey) {
            logger.error('ImageKit private key missing');
            return res.status(500).json({ error: 'ImageKit private key not configured' });
        }

        const response = await axios.get('https://api.imagekit.io/v1/files', {
            auth: {
                username: privateKey,
                password: ''
            },
            params: {
                path: folder,
                fileType: 'all',
                limit: 100
            }
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('ImageKit API error', err, {
            responseData: error.response?.data,
            status: error.response?.status
        });
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || error.message || 'Failed to fetch videos'
        });
    }
});

export default router;
