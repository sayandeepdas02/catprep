import mongoose, { Document, Schema } from 'mongoose';

export type AttemptStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'marked_answered';
export type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'marked_answered';

export interface IMockQuestion extends Document {
  mockTestId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  sectionIndex: number;
  questionIndex: number;
  questionId: mongoose.Types.ObjectId;
}

const mockQuestionSchema = new Schema<IMockQuestion>({
  mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
  attemptId: { type: Schema.Types.ObjectId, ref: 'MockAttempt', required: true },
  sectionIndex: { type: Number, required: true },
  questionIndex: { type: Number, required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
});

mockQuestionSchema.index({ mockTestId: 1, attemptId: 1 }, { unique: true });
mockQuestionSchema.index({ attemptId: 1, sectionIndex: 1 });

export const MockQuestion = mongoose.model<IMockQuestion>('MockQuestion', mockQuestionSchema);

export interface IMockAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  mockTestId: mongoose.Types.ObjectId;
  status: 'in_progress' | 'completed' | 'abandoned' | 'submitted';

  currentSection: number;
  currentQuestion: number;

  sectionStates: Array<{
    sectionIndex: number;
    sectionType: string;
    answers: Record<string, {
      answer: string | string[];
      time: number;
      status: AttemptStatus;
      isCorrect?: boolean;
    }>;
    startTime: number;
    endTime?: number;
    isLocked: boolean;
    questionStatuses: Record<string, AttemptStatus>;
  }>;

  totalScore: number;
  sectionalScores: Record<string, number>;
  percentile: number;
  rank: number;

  startedAt: Date;
  completedAt?: Date;
  timeTaken: number;

  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
}

const mockAttemptSchema = new Schema<IMockAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned', 'submitted'], default: 'in_progress' },
    currentSection: { type: Number, default: 0 },
    currentQuestion: { type: Number, default: 0 },
    sectionStates: [{
      sectionIndex: { type: Number, required: true },
      sectionType: { type: String, required: true },
      answers: { type: Map, of: Object, default: {} },
      startTime: { type: Number, required: true },
      endTime: { type: Number },
      isLocked: { type: Boolean, default: false },
      questionStatuses: { type: Map, of: String, default: {} },
    }],
    totalScore: { type: Number, default: 0 },
    sectionalScores: { type: Map, of: Number, default: {} },
    percentile: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeTaken: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalWrong: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mockAttemptSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });
mockAttemptSchema.index({ mockTestId: 1, percentile: -1 });
mockAttemptSchema.index({ userId: 1, status: 1 });
mockAttemptSchema.index({ completedAt: -1 });

export const MockAttempt = mongoose.model<IMockAttempt>('MockAttempt', mockAttemptSchema);

export interface ITopicPerformance {
  topicId: mongoose.Types.ObjectId;
  topicName: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgTime: number;
}

export interface ISectionalAnalysis {
  sectionType: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgTime: number;
}

export interface ITimeDistribution {
  range: string;
  count: number;
  correct: number;
}

export interface IMockAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  mockTestId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;

  totalScore: number;
  maxScore: number;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  accuracy: number;
  speed: number;

  sectionalAnalysis: ISectionalAnalysis[];
  topicPerformance: ITopicPerformance[];
  timeDistribution: ITimeDistribution[];

  percentile: number;
  estimatedRank: number;
  totalParticipants: number;

  difficultyBreakdown: {
    easy: { attempted: number; correct: number; accuracy: number };
    medium: { attempted: number; correct: number; accuracy: number };
    hard: { attempted: number; correct: number; accuracy: number };
  };

  improvementSuggestions: string[];
  strengths: string[];
  weakAreas: string[];

  comparedToLast: {
    scoreChange: number;
    accuracyChange: number;
    percentileChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

const mockAnalysisSchema = new Schema<IMockAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'MockAttempt', required: true },

    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    totalAttempted: { type: Number, required: true },
    totalCorrect: { type: Number, required: true },
    totalWrong: { type: Number, required: true },
    totalSkipped: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    speed: { type: Number, required: true },

    sectionalAnalysis: [{
      sectionType: { type: String, required: true },
      score: { type: Number, required: true },
      maxScore: { type: Number, required: true },
      attempted: { type: Number, required: true },
      correct: { type: Number, required: true },
      wrong: { type: Number, required: true },
      accuracy: { type: Number, required: true },
      avgTime: { type: Number, required: true },
    }],

    topicPerformance: [{
      topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
      topicName: { type: String, required: true },
      attempted: { type: Number, required: true },
      correct: { type: Number, required: true },
      wrong: { type: Number, required: true },
      accuracy: { type: Number, required: true },
      avgTime: { type: Number, required: true },
    }],

    timeDistribution: [{
      range: { type: String, required: true },
      count: { type: Number, required: true },
      correct: { type: Number, required: true },
    }],

    percentile: { type: Number, required: true },
    estimatedRank: { type: Number, required: true },
    totalParticipants: { type: Number, default: 0 },

    difficultyBreakdown: {
      easy: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
      medium: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
      hard: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    },

    improvementSuggestions: [{ type: String }],
    strengths: [{ type: String }],
    weakAreas: [{ type: String }],

    comparedToLast: {
      scoreChange: { type: Number, default: 0 },
      accuracyChange: { type: Number, default: 0 },
      percentileChange: { type: Number, default: 0 },
      trend: { type: String, enum: ['improving', 'declining', 'stable'], default: 'stable' },
    },
  },
  { timestamps: true }
);

mockAnalysisSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });
mockAnalysisSchema.index({ userId: 1, createdAt: -1 });
mockAnalysisSchema.index({ percentile: -1 });

export const MockAnalysis = mongoose.model<IMockAnalysis>('MockAnalysis', mockAnalysisSchema);

export interface IMockSession extends Document {
  userId: mongoose.Types.ObjectId;
  mockTestId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  currentSection: number;
  currentQuestion: number;
  answers: Record<string, {
    answer: string | string[];
    time: number;
    status: AttemptStatus;
    markedForReview: boolean;
  }>;
  sectionTimers: Record<string, number>;
  lastActivityAt: Date;
}

const mockSessionSchema = new Schema<IMockSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mockTestId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true },
  attemptId: { type: Schema.Types.ObjectId, ref: 'MockAttempt', required: true },
  currentSection: { type: Number, default: 0 },
  currentQuestion: { type: Number, default: 0 },
  answers: { type: Map, of: Object, default: {} },
  sectionTimers: { type: Map, of: Number, default: {} },
  lastActivityAt: { type: Date, default: Date.now },
});

mockSessionSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });
mockSessionSchema.index({ lastActivityAt: -1 });

export const MockSession = mongoose.model<IMockSession>('MockSession', mockSessionSchema);