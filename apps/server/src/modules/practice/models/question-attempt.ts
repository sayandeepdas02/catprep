import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'MCQ' | 'MSQ' | 'TITA';

export interface IQuestionAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  type: QuestionType;
  subject: string;
  topicId: mongoose.Types.ObjectId;
  difficulty: string;
  selectedAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  timeTaken: number;
  isMarkedForReview: boolean;
  isSkipped: boolean;
  attemptedAt: Date;
}

const questionAttemptSchema = new Schema<IQuestionAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'PracticeSession' },
    type: { type: String, enum: ['MCQ', 'MSQ', 'TITA'], required: true },
    subject: { type: String, required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, required: true },
    selectedAnswer: { type: Schema.Types.Mixed },
    correctAnswer: { type: Schema.Types.Mixed },
    isCorrect: { type: Boolean, required: true },
    timeTaken: { type: Number, required: true },
    isMarkedForReview: { type: Boolean, default: false },
    isSkipped: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

questionAttemptSchema.index({ userId: 1, attemptedAt: -1 });
questionAttemptSchema.index({ userId: 1, subject: 1 });
questionAttemptSchema.index({ userId: 1, topicId: 1 });
questionAttemptSchema.index({ userId: 1, sessionId: 1 });

export const QuestionAttempt = mongoose.model<IQuestionAttempt>('QuestionAttempt', questionAttemptSchema);