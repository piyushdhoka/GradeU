import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface ValidationError {
    field: string;
    message: string;
}

export const validateObjectId = (field: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const value = req.params[field] || req.body[field] || req.query[field];
        
        if (!value) {
            res.status(400).json({ error: `${field} is required` });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(value)) {
            res.status(400).json({ error: `Invalid ${field} format` });
            return;
        }

        next();
    };
};

export const validateProctoringEvent = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { studentId, courseId, attemptId, eventType, details } = req.body;

    const errors: ValidationError[] = [];

    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
        errors.push({ field: 'studentId', message: 'studentId is required and must be a non-empty string' });
    }

    if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
        errors.push({ field: 'courseId', message: 'courseId is required and must be a non-empty string' });
    }

    if (!attemptId || typeof attemptId !== 'string' || attemptId.trim().length === 0) {
        errors.push({ field: 'attemptId', message: 'attemptId is required and must be a non-empty string' });
    }

    const validEventTypes = ['tab-switch', 'exit-fullscreen', 'window-blur', 'face-missing', 'multiple-faces', 'suspicious-activity'];
    if (!eventType || !validEventTypes.includes(eventType)) {
        errors.push({ field: 'eventType', message: `eventType must be one of: ${validEventTypes.join(', ')}` });
    }

    if (studentId && studentId.length > 200) {
        errors.push({ field: 'studentId', message: 'studentId must be less than 200 characters' });
    }

    if (courseId && courseId.length > 200) {
        errors.push({ field: 'courseId', message: 'courseId must be less than 200 characters' });
    }

    if (attemptId && attemptId.length > 200) {
        errors.push({ field: 'attemptId', message: 'attemptId must be less than 200 characters' });
    }

    if (details && typeof details !== 'object') {
        errors.push({ field: 'details', message: 'details must be an object' });
    }

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }

    next();
};

export const validateExperienceSync = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { studentId, courseId, moduleStats, aiInteraction } = req.body;

    const errors: ValidationError[] = [];

    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
        errors.push({ field: 'studentId', message: 'studentId is required and must be a non-empty string' });
    }

    if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
        errors.push({ field: 'courseId', message: 'courseId is required and must be a non-empty string' });
    }

    if (moduleStats) {
        if (typeof moduleStats !== 'object' || Array.isArray(moduleStats)) {
            errors.push({ field: 'moduleStats', message: 'moduleStats must be an object' });
        } else {
            if (!moduleStats.moduleId || typeof moduleStats.moduleId !== 'string') {
                errors.push({ field: 'moduleStats.moduleId', message: 'moduleStats.moduleId is required' });
            }
            if (moduleStats.timeSpent !== undefined && (typeof moduleStats.timeSpent !== 'number' || moduleStats.timeSpent < 0)) {
                errors.push({ field: 'moduleStats.timeSpent', message: 'moduleStats.timeSpent must be a non-negative number' });
            }
            if (moduleStats.scrollDepth !== undefined && (typeof moduleStats.scrollDepth !== 'number' || moduleStats.scrollDepth < 0 || moduleStats.scrollDepth > 100)) {
                errors.push({ field: 'moduleStats.scrollDepth', message: 'moduleStats.scrollDepth must be a number between 0 and 100' });
            }
        }
    }

    if (aiInteraction) {
        if (typeof aiInteraction !== 'object' || Array.isArray(aiInteraction)) {
            errors.push({ field: 'aiInteraction', message: 'aiInteraction must be an object' });
        }
    }

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }

    next();
};

