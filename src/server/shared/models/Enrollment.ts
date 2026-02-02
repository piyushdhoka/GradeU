import mongoose from 'mongoose';


const enrollmentSchema = new mongoose.Schema({
    studentEmail: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 } // Percentage
});

// Composite index to prevent double enrollment
enrollmentSchema.index({ studentEmail: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
