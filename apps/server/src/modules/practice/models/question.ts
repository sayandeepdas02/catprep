import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'MCQ' | 'MSQ' | 'TITA';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubjectSlug = 'quant' | 'lr' | 'di' | 'verbal';

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  type: QuestionType;
  subject: SubjectSlug;
  topicId: mongoose.Types.ObjectId;
  subtopic?: string;
  difficulty: Difficulty;
  questionText: string;
  options: IQuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  tags: string[];
  estimatedTime: number;
  source?: string;
  year?: number;
  isPyq: boolean;
  isPremium: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const questionSchema = new Schema<IQuestion>(
  {
    type: { type: String, enum: ['MCQ', 'MSQ', 'TITA'], required: true },
    subject: { type: String, enum: ['quant', 'lr', 'di', 'verbal'], required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    subtopic: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questionText: { type: String, required: true },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String },
    tags: [{ type: String }],
    estimatedTime: { type: Number, default: 120 },
    source: { type: String },
    year: { type: Number },
    isPyq: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, topicId: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ type: 1, isActive: 1 });
questionSchema.index({ isPyq: 1, year: 1 });
questionSchema.index({ tags: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);