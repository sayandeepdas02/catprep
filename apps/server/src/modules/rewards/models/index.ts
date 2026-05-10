import mongoose, { Document, Schema } from 'mongoose';

export type BadgeType = 'streak' | 'mock' | 'battle' | 'accuracy' | 'speed' | 'milestone' | 'special';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IBadge extends Document {
  name: string;
  description: string;
  type: BadgeType;
  icon: string;
  rarity: Rarity;
  xpReward: number;
  criteria: {
    type: string;
    value: number;
  };
  isActive: boolean;
  maxEarners: number;
  currentEarners: number;
}

const badgeSchema = new Schema<IBadge>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['streak', 'mock', 'battle', 'accuracy', 'speed', 'milestone', 'special'], required: true },
  icon: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], default: 'common' },
  xpReward: { type: Number, default: 50 },
  criteria: {
    type: { type: String, required: true },
    value: { type: Number, required: true },
  },
  isActive: { type: Boolean, default: true },
  maxEarners: { type: Number, default: 0 },
  currentEarners: { type: Number, default: 0 },
});

badgeSchema.index({ type: 1, rarity: 1 });
badgeSchema.index({ criteria: 1 });

export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  earnedAt: Date;
  notificationSent: boolean;
}

const userBadgeSchema = new Schema<IUserBadge>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now },
  notificationSent: { type: Boolean, default: false },
});

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1, earnedAt: -1 });

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);

export interface IAchievement extends Document {
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  steps: Array<{
    step: number;
    requirement: number;
    xpReward: number;
    title: string;
  }>;
  isActive: boolean;
}

const achievementSchema = new Schema<IAchievement>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, required: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  xpReward: { type: Number, default: 100 },
  steps: [{
    step: { type: Number, required: true },
    requirement: { type: Number, required: true },
    xpReward: { type: Number, required: true },
    title: { type: String, required: true },
  }],
  isActive: { type: Boolean, default: true },
});

achievementSchema.index({ category: 1, tier: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  currentStep: number;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  xpAwarded: number;
}

const userAchievementSchema = new Schema<IUserAchievement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
  currentStep: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  xpAwarded: { type: Number, default: 0 },
});

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, completedAt: -1 });

export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);

export interface IStreakReward extends Document {
  day: number;
  xpReward: number;
  badgeId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
}

const streakRewardSchema = new Schema<IStreakReward>({
  day: { type: Number, required: true, unique: true },
  xpReward: { type: Number, required: true },
  badgeId: { type: Schema.Types.ObjectId, ref: 'Badge' },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

export const StreakReward = mongoose.model<IStreakReward>('StreakReward', streakRewardSchema);

export interface IDailyActivity extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  questionsSolved: number;
  mocksCompleted: number;
  battlesWon: number;
  xpEarned: number;
  timeSpent: number;
  subjects: Record<string, number>;
}

const dailyActivitySchema = new Schema<IDailyActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  questionsSolved: { type: Number, default: 0 },
  mocksCompleted: { type: Number, default: 0 },
  battlesWon: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  subjects: { type: Map, of: Number, default: {} },
});

dailyActivitySchema.index({ userId: 1, date: -1 });
dailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model<IDailyActivity>('DailyActivity', dailyActivitySchema);