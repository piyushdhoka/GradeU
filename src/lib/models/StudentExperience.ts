import mongoose from 'mongoose';

const moduleStatSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  timeSpent: { type: Number, default: 0 },
  scrollDepth: { type: Number, default: 0 },
  interactions: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
});

const aiInteractionSchema = new mongoose.Schema({
  query: String,
  responseSnippet: String,
  timestamp: { type: Date, default: Date.now },
});

const studentExperienceSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  studentEmail: { type: String, index: true },
  courseId: { type: String, required: true, index: true },
  moduleStats: [moduleStatSchema],
  aiInteractions: [aiInteractionSchema],
  totalTimeSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

studentExperienceSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const StudentExperience =
  mongoose.models.StudentExperience || mongoose.model('StudentExperience', studentExperienceSchema);
