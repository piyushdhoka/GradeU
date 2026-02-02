import mongoose from 'mongoose';

const studentProgressSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    studentEmail: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    moduleId: { type: String, required: true, index: true },
    completed: { type: Boolean, default: false, index: true },
    quizScore: { type: Number, default: null },
    completedTopics: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes for common query patterns
studentProgressSchema.index({ studentEmail: 1, courseId: 1, moduleId: 1 }, { unique: true });
studentProgressSchema.index({ studentId: 1, updatedAt: -1 });
studentProgressSchema.index({ studentEmail: 1, updatedAt: -1 });

export const StudentProgress = mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);
