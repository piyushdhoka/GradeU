import mongoose from 'mongoose';

const moduleExperienceSchema = new mongoose.Schema({
    moduleId: { type: String, required: true },
    timeSpent: { type: Number, default: 0 }, // in seconds
    scrollDepth: { type: Number, default: 0 }, // percentage
    interactions: { type: Number, default: 0 }, // clicks, hovers, etc.
    lastAccessed: { type: Date, default: Date.now }
});

const experienceSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    moduleStats: [moduleExperienceSchema],
    totalTimeSpent: { type: Number, default: 0 },
    aiInteractions: [{
        query: String,
        responseSnippet: String,
        timestamp: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
});

export const StudentExperience = mongoose.model('StudentExperience', experienceSchema);
