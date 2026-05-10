import mongoose, { Document, Schema } from 'mongoose';

export interface IUserNotes extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  content: string;
  approach?: string;
  formula?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userNotesSchema = new Schema<IUserNotes>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    content: { type: String, required: true },
    approach: { type: String },
    formula: { type: String },
  },
  { timestamps: true }
);

userNotesSchema.index({ userId: 1, questionId: 1 }, { unique: true });
userNotesSchema.index({ userId: 1, updatedAt: -1 });

export const UserNotes = mongoose.model<IUserNotes>('UserNotes', userNotesSchema);