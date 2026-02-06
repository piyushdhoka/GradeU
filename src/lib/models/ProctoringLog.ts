import mongoose from 'mongoose';

const proctoringLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true },
  attemptId: { type: String, required: true },
  eventType: {
    type: String,
    required: true,
    enum: [
      'face_detected',
      'face_lost',
      'multiple_faces',
      'tab_switch',
      'window_blur',
      'exit_fullscreen',
      'copy_attempt',
      'paste_attempt',
      'screenshot_attempt',
      'devtools_open',
      'exam_start',
      'exam_end',
      'warning_issued',
    ],
  },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

proctoringLogSchema.index({ studentId: 1, attemptId: 1 });

export const ProctoringLog =
  mongoose.models.ProctoringLog || mongoose.model('ProctoringLog', proctoringLogSchema);
