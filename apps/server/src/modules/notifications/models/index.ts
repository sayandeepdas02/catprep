import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'battle_invite'
  | 'battle_reminder'
  | 'leaderboard_update'
  | 'streak_reminder'
  | 'badge_earned'
  | 'achievement_progress'
  | 'mock_available'
  | 'mock_result'
  | 'xp_milestone'
  | 'friend_request'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['battle_invite', 'battle_reminder', 'leaderboard_update', 'streak_reminder', 'badge_earned', 'achievement_progress', 'mock_available', 'mock_result', 'xp_milestone', 'friend_request', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  expiresAt: { type: Date },
  actionUrl: { type: String },
  icon: { type: String },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export interface IUserNotificationSettings extends Document {
  userId: mongoose.Types.ObjectId;
  pushEnabled: boolean;
  emailEnabled: boolean;
  types: Record<NotificationType, boolean>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
}

const userNotificationSettingsSchema = new Schema<IUserNotificationSettings>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pushEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  types: {
    type: Map,
    of: Boolean,
    default: {
      battle_invite: true,
      battle_reminder: true,
      leaderboard_update: true,
      streak_reminder: true,
      badge_earned: true,
      achievement_progress: true,
      mock_available: true,
      mock_result: true,
      xp_milestone: true,
      friend_request: true,
      system: true,
    },
  },
  quietHoursStart: { type: String },
  quietHoursEnd: { type: String },
  timezone: { type: String, default: 'Asia/Kolkata' },
});

userNotificationSettingsSchema.index({ userId: 1 }, { unique: true });

export const UserNotificationSettings = mongoose.model<IUserNotificationSettings>('UserNotificationSettings', userNotificationSettingsSchema);