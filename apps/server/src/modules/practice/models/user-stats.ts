import mongoose, { Document, Schema } from 'mongoose';

export interface SubjectStats {
  subject: string;
  totalAttempted: number;
  correct: number;
  accuracy: number;
  avgTime: number;
}

export interface TopicStats {
  topicId: mongoose.Types.ObjectId;
  totalAttempted: number;
  correct: number;
  accuracy: number;
  avgTime: number;
}

export interface IUserStats extends Document {
  userId: mongoose.Types.ObjectId;
  totalQuestionsSolved: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalStudyTime: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  dailyStreak: number;
  dailyGoal: number;
  dailySolved: number;
  subjectStats: SubjectStats[];
  topicStats: Map<string, TopicStats>;
  weeklySolved: number[];
  monthlySolved: number[];
}

const userStatsSchema = new Schema<IUserStats>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalQuestionsSolved: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    overallAccuracy: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    dailyStreak: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 20 },
    dailySolved: { type: Number, default: 0 },
    subjectStats: [
      {
        subject: String,
        totalAttempted: Number,
        correct: Number,
        accuracy: Number,
        avgTime: Number,
      },
    ],
    topicStats: { type: Map, of: Object },
    weeklySolved: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
    monthlySolved: { type: [Number], default: Array(30).fill(0) },
  },
  { timestamps: true }
);

export const UserStats = mongoose.model<IUserStats>('UserStats', userStatsSchema);