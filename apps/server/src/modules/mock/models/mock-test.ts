import mongoose, { Document, Schema } from 'mongoose';

export type MockType = 'full' | 'sectional' | 'topic';
export type MockStatus = 'draft' | 'published' | 'archived';

export interface IMockSection {
  name: string;
  type: 'VARC' | 'LRDI' | 'QA';
  duration: number;
  questions: number;
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface IMockTest extends Document {
  title: string;
  description: string;
  type: MockType;
  sections: IMockSection[];
  totalDuration: number;
  totalQuestions: number;
  totalMarks: number;
  isPremium: boolean;
  isActive: boolean;
  scheduledAt?: Date;
  year: number;
  source: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy?: mongoose.Types.ObjectId;
}

const mockSectionSchema = new Schema<IMockSection>({
  name: { type: String, required: true },
  type: { type: String, enum: ['VARC', 'LRDI', 'QA'], required: true },
  duration: { type: Number, required: true },
  questions: { type: Number, required: true },
  marksPerQuestion: { type: Number, default: 3 },
  negativeMarks: { type: Number, default: 1 },
});

const mockTestSchema = new Schema<IMockTest>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['full', 'sectional', 'topic'], required: true },
    sections: [mockSectionSchema],
    totalDuration: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    scheduledAt: { type: Date },
    year: { type: Number },
    source: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mockTestSchema.index({ type: 1, isActive: 1 });
mockTestSchema.index({ year: 1 });

export const MockTest = mongoose.model<IMockTest>('MockTest', mockTestSchema);