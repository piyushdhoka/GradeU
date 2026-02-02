import { Router, type Request, type Response } from 'express';
import { logger } from '../../../shared/lib/logger.js';
import { StudentExperience } from '../models/StudentExperience.js';
import { authenticateUser, AuthenticatedRequest } from '../../../shared/middleware/auth.js';
import { sendEmail } from '../../../shared/lib/email.js';

const router = Router();

// Endpoint to get student stats (time spent)
router.get('/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const experiences = await StudentExperience.find({ studentId });

        let totalSeconds = 0;
        experiences.forEach(exp => {
            exp.moduleStats.forEach((mod: any) => {
                totalSeconds += mod.timeSpent || 0;
            });
        });

        res.json({
            totalTimeSeconds: totalSeconds,
            experienceCount: experiences.length
        });
    } catch (error) {
        logger.error('Failed to fetch student stats:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Endpoint to report a bug
router.post('/report-bug', async (req: Request, res: Response) => {
    const { description, studentName, studentEmail } = req.body;

    if (!description) {
        return res.status(400).json({ error: 'Description is required' });
    }

    try {
        const subject = `GradeU Bug Report: ${studentName || 'Anonymous'}`;
        const text = `
        Student: ${studentName || 'Anonymous'}
        Email: ${studentEmail || 'N/A'}
        
        Problem Description:
        ${description}
      `;

        await sendEmail('smartgaurd123@gmail.com', subject, text);
        logger.info(`Bug report sent to smartgaurd123@gmail.com from ${studentEmail || 'Anonymous'}`);

        res.json({ success: true, message: 'Bug report sent successfully' });
    } catch (error) {
        logger.error('Failed to send bug report:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to send bug report' });
    }
});

export default router;
