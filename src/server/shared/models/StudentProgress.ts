import mongoose from 'mongoose';

const studentProgressSchema = new mongoose.Schema({
    studentEmail: {
        type: String,
        required: true,
        index: true
    },
    courseId: {
        type: String,
        required: true,
        index: true
    },
    moduleId: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    quizScore: {
        type: Number,
        default: null
    },
    completedTopics: [{
        type: String // Store topic titles or IDs
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Composite index to ensure unique progress entry per student per module per course
studentProgressSchema.index({ studentEmail: 1, courseId: 1, moduleId: 1 }, { unique: true });

export const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);
