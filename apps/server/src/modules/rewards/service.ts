import mongoose from 'mongoose';
import { User } from '../user/model.js';
import { Badge, UserBadge, Achievement, UserAchievement, StreakReward, DailyActivity } from './models/index.js';
import { createNotification } from '../notifications/service.js';

interface XPAwardResult {
  xpAwarded: number;
  newTotal: number;
  badges: string[];
  achievements: string[];
  streakMilestone?: number;
}

interface ActivityInput {
  questionsSolved?: number;
  mocksCompleted?: number;
  battlesWon?: number;
  timeSpent?: number;
}

export async function awardXP(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  reason: string,
  activity?: ActivityInput
): Promise<XPAwardResult> {
  const userOid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const user = await User.findByIdAndUpdate(
    userOid,
    { $inc: { xp: amount } },
    { new: true }
  );

  if (!user) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await DailyActivity.findOneAndUpdate(
    { userId: userOid, date: today },
    {
      $inc: {
        questionsSolved: activity?.questionsSolved || 0,
        mocksCompleted: activity?.mocksCompleted || 0,
        battlesWon: activity?.battlesWon || 0,
        xpEarned: amount,
        timeSpent: activity?.timeSpent || 0,
      },
      $setOnInsert: { userId: userOid, date: today },
    },
    { upsert: true, new: true }
  );

  const badges: string[] = [];
  const achievements: string[] = [];
  let streakMilestone: number | undefined;

  const earnedBadges = await checkBadges(userOid, user.xp, user.streak);
  badges.push(...earnedBadges);

  const earnedAchievements = await checkAchievements(userOid, activity);
  achievements.push(...earnedAchievements);

  if (user.xp > 0 && user.xp % 1000 === 0) {
    await createNotification({
      userId: userOid.toString(),
      type: 'xp_milestone',
      title: 'XP Milestone!',
      message: `Congratulations! You've reached ${user.xp} XP!`,
      priority: 'normal',
      actionUrl: '/profile',
    });
    streakMilestone = Math.floor(user.xp / 1000) * 1000;
  }

  return {
    xpAwarded: amount,
    newTotal: user.xp,
    badges,
    achievements,
    streakMilestone,
  };
}

async function checkBadges(userId: mongoose.Types.ObjectId, xp: number, streak: number): Promise<string[]> {
  const earnedBadgeIds = await UserBadge.find({ userId }).distinct('badgeId');
  const newBadges: string[] = [];

  const criteria = [
    { type: 'xp_100', value: 100, xpReward: 25 },
    { type: 'xp_1000', value: 1000, xpReward: 100 },
    { type: 'xp_5000', value: 5000, xpReward: 250 },
    { type: 'xp_10000', value: 10000, xpReward: 500 },
    { type: 'streak_7', value: 7, xpReward: 50 },
    { type: 'streak_30', value: 30, xpReward: 150 },
    { type: 'streak_100', value: 100, xpReward: 500 },
  ];

  for (const criterion of criteria) {
    const badge = await Badge.findOne({ 'criteria.type': criterion.type, 'criteria.value': criterion.value });
    if (!badge || earnedBadgeIds.some(id => id.equals(badge._id))) continue;

    let earned = false;
    if (criterion.type.startsWith('xp_')) earned = xp >= criterion.value;
    if (criterion.type.startsWith('streak_')) earned = streak >= criterion.value;

    if (earned) {
      await UserBadge.create({ userId, badgeId: badge._id });
      await Badge.findByIdAndUpdate(badge._id, { $inc: { currentEarners: 1 } });
      newBadges.push(badge.name);

      await createNotification({
        userId: userId.toString(),
        type: 'badge_earned',
        title: 'Badge Earned!',
        message: `You earned the "${badge.name}" badge!`,
        priority: 'normal',
        actionUrl: '/profile/badges',
        icon: badge.icon,
      });
    }
  }

  return newBadges;
}

async function checkAchievements(
  userId: mongoose.Types.ObjectId,
  _activity?: ActivityInput
): Promise<string[]> {
  const earnedAchievements: string[] = [];
  return earnedAchievements;
}

export async function updateStreak(userId: string): Promise<{ streak: number; reward?: number }> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = user.streak;
  const lastActive = user.updatedAt ? new Date(user.updatedAt) : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);

    if (lastActive.getTime() === today.getTime()) {
    } else if (lastActive.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  user.streak = newStreak;
  await user.save();

  let reward: number | undefined;
  const streakReward = await StreakReward.findOne({ day: newStreak });
  if (streakReward) {
    reward = streakReward.xpReward;
    await awardXP(userId, reward, `Streak milestone: ${newStreak} days`);
  }

  return { streak: newStreak, reward };
}

export async function getUserRewards(userId: string) {
  const [badges, achievements, stats] = await Promise.all([
    UserBadge.find({ userId }).populate('badgeId').lean(),
    UserAchievement.find({ userId }).populate('achievementId').lean(),
    User.findById(userId).select('xp streak').lean(),
  ]);

  return {
    xp: (stats as any)?.xp || 0,
    streak: (stats as any)?.streak || 0,
    badges: badges.map((ub: any) => ({
      ...ub.badgeId,
      earnedAt: ub.earnedAt,
    })),
    achievements: achievements.map((ua: any) => ({
      ...ua.achievementId,
      currentStep: ua.currentStep,
      progress: ua.progress,
      completedAt: ua.completedAt,
    })),
  };
}

export async function getLeaderboardRewards() {
  const rewards = await StreakReward.find().sort({ day: 1 }).lean();
  return rewards;
}

export async function getMilestones() {
  const milestones = [
    { xp: 100, title: 'Getting Started', description: 'Earn your first 100 XP' },
    { xp: 500, title: 'Dedicated Learner', description: 'Earn 500 XP' },
    { xp: 1000, title: 'Rising Star', description: 'Reach 1000 XP' },
    { xp: 2500, title: 'Scholar', description: 'Reach 2500 XP' },
    { xp: 5000, title: 'Expert', description: 'Reach 5000 XP' },
    { xp: 10000, title: 'Master', description: 'Reach 10000 XP' },
    { xp: 25000, title: 'Legend', description: 'Reach 25000 XP' },
  ];
  return milestones;
}