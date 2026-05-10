import mongoose, { Document, Schema } from 'mongoose';

export type MockType = 'full' | 'sectional' | 'topic';
export type MockStatus = 'draft' | 'published' | 'archived';
export type MockSectionType = 'VARC' | 'LRDI' | 'QA';

export interface IMockSection {
  name: string;
  type: MockSectionType;
  duration: number;
  questions: number;
  marksPerQuestion: number;
  negativeMarks: number;
  order: number;
  questionIds: mongoose.Types.ObjectId[];
  isLocked?: boolean;
}

export interface IMockTest extends Document {
  title: string;
  description: string;
  type: MockType;
  sectionType?: MockSectionType;
  topicId?: mongoose.Types.ObjectId;
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
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  attemptCount: number;
  avgScore: number;
}

const mockSectionSchema = new Schema<IMockSection>({
  name: { type: String, required: true },
  type: { type: String, enum: ['VARC', 'LRDI', 'QA'], required: true },
  duration: { type: Number, required: true },
  questions: { type: Number, required: true },
  marksPerQuestion: { type: Number, default: 3 },
  negativeMarks: { type: Number, default: 1 },
  order: { type: Number, default: 0 },
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
});

const mockTestSchema = new Schema<IMockTest>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['full', 'sectional', 'topic'], required: true },
    sectionType: { type: String, enum: ['VARC', 'LRDI', 'QA'] },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
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
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attemptCount: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mockTestSchema.index({ type: 1, isActive: 1 });
mockTestSchema.index({ year: 1, type: 1 });
mockTestSchema.index({ difficulty: 1 });
mockTestSchema.index({ sectionType: 1 });
mockTestSchema.index({ 'sections.type': 1 });

export const MockTest = mongoose.model<IMockTest>('MockTest', mockTestSchema);