import mongoose from 'mongoose';

const proctoringLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, default: 'unknown-course' },
  attemptId: { type: String, required: true, default: 'unknown-attempt' },
  eventType: { type: String, required: true, trim: true, maxlength: 80 },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
});

proctoringLogSchema.index({ studentId: 1, attemptId: 1 });
proctoringLogSchema.index({ attemptId: 1, timestamp: -1 });

export const ProctoringLog =
  mongoose.models.ProctoringLog || mongoose.model('ProctoringLog', proctoringLogSchema);
