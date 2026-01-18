import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.warn('Warning: MONGODB_URL not found in environment variables.');
}

export const connectMongoDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    try {
        await mongoose.connect(MONGODB_URL!);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

// Log Schema for Course Generation
const CourseLogSchema = new mongoose.Schema({
    jobId: String,
    courseTitle: String,
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' },
    message: String,
    meta: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
});

export const CourseLog = mongoose.models.CourseLog || mongoose.model('CourseLog', CourseLogSchema);

export const addCourseLog = async (jobId: string, courseTitle: string, message: string, level: string = 'INFO', meta: any = {}) => {
    try {
        await connectMongoDB();
        await CourseLog.create({ jobId, courseTitle, message, level, meta });
    } catch (err) {
        console.error('Failed to save log to MongoDB:', err);
    }
};
