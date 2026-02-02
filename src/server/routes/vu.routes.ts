import express from 'express';
import VUStudent from '../shared/models/VUStudent.js';
import { logger } from '../shared/lib/logger.js';

const router = express.Router();

// Register a new VU Student
router.post('/register', async (req, res) => {
    try {
        const { name, vu_email, faculty_name, year, department } = req.body;

        // Check if already exists
        const existing = await VUStudent.findOne({ vu_email });
        if (existing) {
            res.status(400).json({ message: 'Student already registered with this email' });
            return;
        }

        const student = await VUStudent.create({
            name,
            vu_email,
            faculty_name,
            year,
            department
        });

        res.status(201).json(student);
    } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Registration error', err);
        res.status(500).json({ message: error.message });
    }
});

// Check if student is registered
router.get('/check-registration/:email', async (req, res) => {
    try {
        const student = await VUStudent.findOne({ vu_email: req.params.email });
        res.json({ registered: !!student, student });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update Progress
router.post('/progress', async (req, res) => {
    try {
        const { vu_email, course_id, module_id, completed, quiz_score, locked_until } = req.body;

        const student = await VUStudent.findOne({ vu_email });
        if (!student) {
            res.status(404).json({ message: 'Student not found' });
            return;
        }

        // Check if progress for this module already exists
        const existingProgressIndex = student.progress.findIndex(
            (p: any) => p.course_id === course_id && p.module_id === module_id
        );

        if (existingProgressIndex >= 0) {
            // Update existing
            if (completed !== undefined) student.progress[existingProgressIndex].completed = completed;
            if (quiz_score !== undefined) student.progress[existingProgressIndex].quiz_score = quiz_score;
            if (locked_until !== undefined) student.progress[existingProgressIndex].locked_until = locked_until;
            student.progress[existingProgressIndex].completed_at = new Date();
        } else {
            // Push new
            student.progress.push({
                course_id,
                module_id,
                completed,
                quiz_score,
                locked_until,
                completed_at: new Date()
            });
        }

        await student.save();
        res.json(student);
    } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Progress update error', err, { vu_email: req.body.vu_email });
        res.status(500).json({ message: error.message });
    }
});

// Get Progress for a course
router.get('/progress/:email/:courseId', async (req, res) => {
    try {
        const { email, courseId } = req.params;
        const student = await VUStudent.findOne({ vu_email: email });

        if (!student) {
            // Return empty if not found, frontend handles registration check separately
            res.json([]);
            return;
        }

        const courseProgress = student.progress.filter((p: any) => p.course_id === courseId);
        res.json(courseProgress);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Get Student Details
router.get('/student/:email', async (req, res) => {
    try {
        const student = await VUStudent.findOne({ vu_email: req.params.email });
        if (!student) {
            res.status(404).json({ message: 'Student not found' });
            return;
        }
        res.json(student);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
