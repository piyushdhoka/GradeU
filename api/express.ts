import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server/server';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Rewrite the URL to remove the /api/express prefix so Express routing works
    if (req.url && req.url.startsWith('/api/express')) {
        req.url = req.url.replace('/api/express', '') || '/';
    }

    // Forward to Express
    return app(req, res);
}
