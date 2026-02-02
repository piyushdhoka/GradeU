import mongoose, { Document, Model } from 'mongoose';

export interface IVUStudent extends Document {
    name: string;
    vu_email: string;
    faculty_name: string;
    year: string;
    department: string;
    registered_at: Date;
    progress: {
        course_id: string;
        module_id: string;
        completed: boolean;
        quiz_score?: number;
        locked_until?: Date;
        completed_at: Date;
    }[];
}

const vuStudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    vu_email: { type: String, required: true, unique: true },
    faculty_name: { type: String, required: true },
    year: { type: String, required: true },
    department: { type: String, required: true },
    registered_at: { type: Date, default: Date.now },
    progress: [{
        course_id: String,
        module_id: String,
        completed: Boolean,
        quiz_score: Number,
        locked_until: Date,
        completed_at: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

const VUStudent = (mongoose.models.VUStudent || mongoose.model<IVUStudent>('VUStudent', vuStudentSchema)) as Model<IVUStudent>;

export default VUStudent;
