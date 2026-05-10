import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String },
    color: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);