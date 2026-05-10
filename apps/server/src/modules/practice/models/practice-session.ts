import mongoose, { Document, Schema } from 'mongoose';

export type PracticeMode = 'topic' | 'timed' | 'accuracy' | 'pyq';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface IPracticeSession extends Document {
  userId: mongoose.Types.ObjectId;
  mode: PracticeMode;
  status: SessionStatus;
  
  // Filters used
  subjects?: string[];
  topicIds?: mongoose.Types.ObjectId[];
  difficulties?: string[];
  questionTypes?: string[];
  timeLimit?: number;
  questionCount?: number;
  isPyq?: boolean;
  
  // Results
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  totalTime: number;
  
  // Metadata
  startedAt: Date;
  completedAt?: Date;
  deviceInfo?: string;
}

const practiceSessionSchema = new Schema<IPracticeSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['topic', 'timed', 'accuracy', 'pyq'], required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    
    subjects: [{ type: String }],
    topicIds: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    difficulties: [{ type: String }],
    questionTypes: [{ type: String }],
    timeLimit: { type: Number },
    questionCount: { type: Number },
    isPyq: { type: Boolean, default: false },
    
    totalQuestions: { type: Number, default: 0 },
    answeredQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    deviceInfo: { type: String },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ userId: 1, startedAt: -1 });
practiceSessionSchema.index({ userId: 1, mode: 1 });
practiceSessionSchema.index({ status: 1 });

export const PracticeSession = mongoose.model<IPracticeSession>('PracticeSession', practiceSessionSchema);