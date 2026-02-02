import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const proctoringRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
    message: 'Too many proctoring log requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use studentId from body if available, otherwise fall back to IP
        return req.body?.studentId || ipKeyGenerator(req.ip || 'unknown');
    },
});

export const experienceRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per IP (heartbeat every 30s = 2/min, so 10 is safe)
    message: 'Too many experience sync requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.body?.studentId || ipKeyGenerator(req.ip || 'unknown');
    },
});

