import mongoose, { Document, Schema } from 'mongoose';

export interface IMockQuestion extends Document {
  mockTestId: mongoose.Types.ObjectId;
  sectionIndex: number;
  questionIndex: number;
  questionId: mongoose.Types.ObjectId;
}

const mockQuestionSchema = new Schema<IMockQuestion>({
  mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
  sectionIndex: { type: Number, required: true },
  questionIndex: { type: Number, required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
});

mockQuestionSchema.index({ mockTestId: 1, sectionIndex: 1, questionIndex: 1 });

export const MockQuestion = mongoose.model<IMockQuestion>('MockQuestion', mockQuestionSchema);

export type AttemptStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'marked_answered';

export interface IMockAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  mockTestId: mongoose.Types.ObjectId;
  status: 'in_progress' | 'completed' | 'abandoned';
  
  currentSection: number;
  sectionAnswers: Map<string, {
    answers: Map<string, { answer: string | string[]; time: number; status: AttemptStatus }>;
    startTime: Date;
    endTime?: Date;
    isLocked: boolean;
  }>;
  
  totalScore: number;
  sectionalScores: Map<string, number>;
  percentile: number;
  rank: number;
  
  startedAt: Date;
  completedAt?: Date;
  timeTaken: number;
}

const mockAttemptSchema = new Schema<IMockAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    currentSection: { type: Number, default: 0 },
    sectionAnswers: { type: Map, of: Object },
    totalScore: { type: Number, default: 0 },
    sectionalScores: { type: Map, of: Number },
    percentile: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeTaken: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mockAttemptSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });
mockAttemptSchema.index({ mockTestId: 1, percentile: -1 });

export const MockAttempt = mongoose.model<IMockAttempt>('MockAttempt', mockAttemptSchema);

export interface IMockAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  mockTestId: mongoose.Types.ObjectId;
  
  totalScore: number;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  accuracy: number;
  speed: number;
  
  sectionalAnalysis: Map<string, {
    score: number;
    attempted: number;
    correct: number;
    wrong: number;
    accuracy: number;
    avgTime: number;
  }>;
  
  topicPerformance: Array<{
    topicId: mongoose.Types.ObjectId;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  
  timeDistribution: Array<{
    range: string;
    count: number;
  }>;
  
  percentile: number;
  estimatedRank: number;
  improvementSuggestions: string[];
}

const mockAnalysisSchema = new Schema<IMockAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
    totalScore: { type: Number, required: true },
    totalAttempted: { type: Number, required: true },
    totalCorrect: { type: Number, required: true },
    totalWrong: { type: Number, required: true },
    totalSkipped: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    speed: { type: Number, required: true },
    sectionalAnalysis: { type: Map, of: Object },
    topicPerformance: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    timeDistribution: [{ range: String, count: Number }],
    percentile: { type: Number, required: true },
    estimatedRank: { type: Number, required: true },
    improvementSuggestions: [{ type: String }],
  },
  { timestamps: true }
);

mockAnalysisSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });

export const MockAnalysis = mongoose.model<IMockAnalysis>('MockAnalysis', mockAnalysisSchema);