import mongoose from 'mongoose';


const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
});

const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
});

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: false }, // Made optional if topics exist
    topics: [topicSchema], // Support granular topics
    type: { type: String, enum: ['lecture', 'quiz', 'initial_assessment', 'final_assessment'], default: 'lecture' },
    quiz: [questionSchema], // Array of questions
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    teacherEmail: { type: String, required: true }, // Link to author
    modules: [moduleSchema],
    difficulty: { type: String, default: 'Intermediate' }, // Added for frontend compatibility
    duration: { type: String, default: '10 hours' }, // Added for frontend compatibility
    createdAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false }
});

export const Course = mongoose.model('Course', courseSchema);
