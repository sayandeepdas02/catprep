import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  notes?: string;
  tags?: string[];
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    notes: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);