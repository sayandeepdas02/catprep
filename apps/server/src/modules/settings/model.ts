import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  weeklyReport: boolean;
  targetStudyHours: number;
}

const settingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    dailyReminder: { type: Boolean, default: true },
    reminderTime: { type: String, default: '09:00' },
    weeklyReport: { type: Boolean, default: true },
    targetStudyHours: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', settingsSchema);