import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL || process.env.mongo_api;

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

// CyberCoach Compatible Course Schema
const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
});

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true }, // Markdown content
    type: {
        type: String,
        enum: ['lecture', 'quiz', 'initial_assessment', 'final_assessment'],
        default: 'lecture'
    },
    quiz: [QuestionSchema],
});

const CyberCoachCourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // We'll use courseId
    teacherEmail: { type: String, required: true },
    modules: [ModuleSchema],
    difficulty: { type: String, default: 'Intermediate' },
    duration: { type: String, default: '10 hours' },
    createdAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false }
});

// Explicitly map to 'courses' collection to match CyberCoach
export const CyberCoachCourse = mongoose.models.Course || mongoose.model('Course', CyberCoachCourseSchema, 'courses');

export const addCourseLog = async (jobId: string, courseTitle: string, message: string, level: string = 'INFO', meta: any = {}) => {
    try {
        await connectMongoDB();
        await CourseLog.create({ jobId, courseTitle, message, level, meta });
    } catch (err) {
        console.error('Failed to save log to MongoDB:', err);
    }
};

export const syncCourseToMongo = async (courseId: string, title: string, modules: any[], quizzes: any[] = []) => {
    try {
        await connectMongoDB();

        // Transform modules to match schema
        // Note: We might receive quizzes separately or embedded.
        // Assuming modules have { title, content, quiz }

        await CyberCoachCourse.findOneAndUpdate(
            { code: courseId },
            {
                title,
                description: `AI Generated Course: ${title}`,
                code: courseId,
                teacherEmail: 'ai-generator@cybercoach.bot',
                modules: modules.map(m => ({
                    title: m.title,
                    content: m.content || "Content coming soon...",
                    type: m.type || 'lecture',
                    quiz: m.quiz || []
                })),
                published: true,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`Synced course ${courseId} to MongoDB (courses collection)`);
    } catch (err) {
        console.error('Failed to sync course to MongoDB:', err);
    }
}
