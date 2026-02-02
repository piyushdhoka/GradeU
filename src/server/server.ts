import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ quiet: true } as any);

import studentRoutes from './features/student/routes/index.js';
import imagekitRoutes from './routes/imagekit.routes.js';
import connectDB from './shared/lib/mongodb.js';
import { logger } from './shared/lib/logger.js';

// Connect to MongoDB
connectDB();

const app = express();
const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 4000;

import rateLimit from 'express-rate-limit';

// Global Rate Limiter: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(cors({
  origin: [
    'http://localhost:3000',     // Next.js dev
    'http://localhost:5173',     // Legacy Vite dev (optional cleanup later)
    'https://sparkstudio.co.in', // Main app prod
    'https://gradeu.in',         // Production domain
    /\.vercel\.app$/,            // All Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/student', studentRoutes);

app.use('/api/imagekit', imagekitRoutes);

app.get('/', (_req: Request, res: Response): void => {
  res.json({
    message: 'VOIS Hackathon API',
    modules: ['student']
  });
});

import { fileURLToPath } from 'url';

// Only listen if run directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    logger.info(`Backend server running on http://localhost:${PORT}`);
  });
}

// Force restart for env vars
export default app;
