import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  targetPercentile: number;
  streak: number;
  xp: number;
  provider: 'email' | 'google';
  onboardingCompleted: boolean;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    avatar: { type: String },
    targetPercentile: { type: Number, default: 99 },
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    provider: { type: String, enum: ['email', 'google'], default: 'email' },
    onboardingCompleted: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);