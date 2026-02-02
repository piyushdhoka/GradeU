import { Router, Request, Response } from 'express';
import { markLabAsCompleted } from '../services/labService.js';
import { logger } from '../../../shared/lib/logger.js';
import { supabase } from '../../../shared/lib/supabase.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for webhook endpoints (more lenient than user endpoints)
const webhookRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: 'Too many webhook requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Webhook endpoint for external lab completion sync
 * Called by render website when student completes a lab
 * 
 * Expected payload:
 * {
 *   studentId: string (UUID),
 *   labId: string,
 *   completedAt?: string (ISO timestamp),
 *   metadata?: object (optional lab-specific data)
 * }
 */
router.post('/webhook/complete',
    webhookRateLimiter,
    async (req: Request, res: Response) => {
        try {
            const { studentId, labId, completedAt, metadata } = req.body;

            // Validation
            if (!studentId || typeof studentId !== 'string') {
                return res.status(400).json({
                    error: 'Invalid studentId. Must be a valid UUID string.'
                });
            }

            if (!labId || typeof labId !== 'string' || labId.trim().length === 0) {
                return res.status(400).json({
                    error: 'Invalid labId. Must be a non-empty string.'
                });
            }

            // Validate UUID format (basic check)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(studentId)) {
                return res.status(400).json({
                    error: 'Invalid studentId format. Must be a valid UUID.'
                });
            }

            // Verify webhook secret/API key
            const webhookSecret = req.headers['x-webhook-secret'];
            if (!process.env.LAB_WEBHOOK_SECRET || webhookSecret !== process.env.LAB_WEBHOOK_SECRET) {
                logger.warn('Unauthorized lab completion webhook attempt', {
                    studentId,
                    labId,
                    ip: req.ip
                });
                return res.status(401).json({
                    error: 'Unauthorized: Invalid or missing webhook secret'
                });
            }

            logger.info('Lab completion webhook received', {
                studentId,
                labId,
                source: 'external',
                ip: req.ip
            });

            // Mark lab as completed
            const completion = await markLabAsCompleted(
                supabase,
                studentId.trim(),
                labId.trim()
            );

            res.status(200).json({
                success: true,
                message: 'Lab completion synced successfully',
                completion: {
                    id: completion.id,
                    labId: completion.labId,
                    completedAt: completedAt || completion.completedAt,
                }
            });

        } catch (error) {
            logger.error('Lab completion webhook error',
                error instanceof Error ? error : new Error(String(error)),
                {
                    studentId: req.body?.studentId,
                    labId: req.body?.labId,
                    ip: req.ip
                }
            );

            // Don't expose internal errors to external caller
            res.status(500).json({
                error: 'Failed to sync lab completion',
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Health check endpoint for webhook
 */
router.get('/webhook/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'lab-sync-webhook',
        timestamp: new Date().toISOString()
    });
});

export default router;

