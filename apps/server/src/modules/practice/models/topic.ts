import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  slug: string;
  subjectId: mongoose.Types.ObjectId;
  description?: string;
  order: number;
}

const topicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);