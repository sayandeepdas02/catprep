import { User } from '../user/model.js';
import { UserStats } from '../practice/models/index.js';
import { BattleResult } from '../battle/models/index.js';
import { MockAttempt } from '../mock/models/index.js';
import mongoose from 'mongoose';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  accuracy: number;
  totalSolved: number;
  weeklyXp: number;
  mockRank?: number;
  battleRank?: number;
  battlesWon?: number;
  battlesPlayed?: number;
}

export async function getGlobalLeaderboard(limit = 20, offset = 0): Promise<LeaderboardEntry[]> {
  const stats = await UserStats.find().sort({ totalXP: -1 }).skip(offset).limit(limit).lean();

  const userIds = stats.map((s: any) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return stats.map((stat: any, index: number) => {
    const user = userMap.get(stat.userId?.toString() || '');
    return {
      rank: offset + index + 1,
      userId: stat.userId?.toString() || '',
      name: user?.name || 'Anonymous',
      avatar: user?.avatar,
      xp: stat.totalXP || 0,
      streak: stat.currentStreak || 0,
      accuracy: stat.overallAccuracy || 0,
      totalSolved: stat.totalQuestionsSolved || 0,
      weeklyXp: (stat.weeklySolved || []).reduce((a: number, b: number) => a + b, 0),
    };
  });
}

export async function getWeeklyLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stats = await UserStats.find({ lastActiveDate: { $gte: weekAgo } }).lean();

  const sorted = stats
    .map((stat: any) => ({
      ...stat,
      weeklyScore: (stat.weeklySolved || [0, 0, 0, 0, 0, 0, 0]).reduce((a: number, b: number) => a + b, 0),
    }))
    .sort((a: any, b: any) => b.weeklyScore - a.weeklyScore)
    .slice(0, limit);

  const userIds = sorted.map((s: any) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return sorted.map((stat: any, index: number) => {
    const user = userMap.get(stat.userId?.toString() || '');
    return {
      rank: index + 1,
      userId: stat.userId?.toString() || '',
      name: user?.name || 'Anonymous',
      avatar: user?.avatar,
      xp: stat.totalXP || 0,
      streak: stat.currentStreak || 0,
      accuracy: stat.overallAccuracy || 0,
      totalSolved: stat.totalQuestionsSolved || 0,
      weeklyXp: stat.weeklyScore,
    };
  });
}

export async function getMockLeaderboard(mockTestId: string, limit = 20): Promise<LeaderboardEntry[]> {
  const attempts = await MockAttempt.find({ mockTestId: new mongoose.Types.ObjectId(mockTestId) })
    .sort({ percentile: -1, totalScore: -1 })
    .limit(limit)
    .lean();

  const userIds = attempts.map((a: any) => a.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return attempts.map((attempt: any, index: number) => {
    const user = userMap.get(attempt.userId?.toString() || '');
    return {
      rank: index + 1,
      userId: attempt.userId?.toString() || '',
      name: user?.name || 'Anonymous',
      avatar: user?.avatar,
      xp: attempt.totalScore || 0,
      streak: 0,
      accuracy: attempt.totalAttempted > 0 ? (attempt.totalCorrect / attempt.totalAttempted) * 100 : 0,
      totalSolved: attempt.totalAttempted || 0,
      weeklyXp: 0,
      mockRank: index + 1,
    };
  });
}

export async function getBattleLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const results = await BattleResult.find({ completedAt: { $gte: weekAgo } }).lean();

  const userStats = new Map<string, { xp: number; wins: number; played: number }>();

  for (const result of results) {
    for (const participant of result.participants) {
      const userId = participant.userId.toString();
      const current = userStats.get(userId) || { xp: 0, wins: 0, played: 0 };
      current.xp += participant.score;
      current.played++;
      if (result.winnerId.toString() === userId) {
        current.wins++;
      }
      userStats.set(userId, current);
    }
  }

  const sorted = Array.from(userStats.entries())
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);

  const userIds = sorted.map(s => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return sorted.map((entry: any, index: number) => {
    const user = userMap.get(entry.userId);
    return {
      rank: index + 1,
      userId: entry.userId,
      name: user?.name || 'Anonymous',
      avatar: user?.avatar,
      xp: entry.xp,
      streak: entry.wins,
      accuracy: 0,
      totalSolved: 0,
      weeklyXp: entry.xp,
      battlesWon: entry.wins,
      battlesPlayed: entry.played,
      battleRank: index + 1,
    };
  });
}

export async function getFriendsLeaderboard(userId: string, limit = 20): Promise<LeaderboardEntry[]> {
  const { UserStats } = await import('../practice/models/index.js');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const friendIds = [userId];
  const friends = (user as any).friends || [];
  friendIds.push(...friends.map((f: any) => f.toString()));

  const stats = await UserStats.find({ userId: { $in: friendIds } }).lean();
  const statsMap = new Map(stats.map((s: any) => [s.userId?.toString(), s]));

  const users = await User.find({ _id: { $in: friendIds } }).lean();

  const entries: LeaderboardEntry[] = users.map(u => {
    const stat = statsMap.get(u._id.toString()) || {};
    return {
      rank: 0,
      userId: u._id.toString(),
      name: u.name,
      avatar: u.avatar,
      xp: (stat as any)?.totalXP || u.xp || 0,
      streak: (stat as any)?.currentStreak || u.streak || 0,
      accuracy: (stat as any)?.overallAccuracy || 0,
      totalSolved: (stat as any)?.totalQuestionsSolved || 0,
      weeklyXp: 0,
    };
  });

  entries.sort((a, b) => b.xp - a.xp);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries.slice(0, limit);
}

export async function getUserRank(userId: string): Promise<{
  global: number;
  weekly: number;
  battle?: number;
  mock?: { mockId: string; rank: number }[];
}> {
  const allStats = await UserStats.find().sort({ totalXP: -1 }).lean();
  const globalRank = allStats.findIndex((s: any) => s.userId?.toString() === userId) + 1;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyStats = await UserStats.find({ lastActiveDate: { $gte: weekAgo } }).lean();
  const sorted = weeklyStats
    .map((stat: any) => ({
      ...stat,
      weeklyScore: (stat.weeklySolved || [0, 0, 0, 0, 0, 0, 0]).reduce((a: number, b: number) => a + b, 0),
    }))
    .sort((a: any, b: any) => b.weeklyScore - a.weeklyScore);
  const weeklyRank = sorted.findIndex((s: any) => s.userId?.toString() === userId) + 1;

  return { global: globalRank || 0, weekly: weeklyRank || 0 };
}

export async function awardXP(userId: string, amount: number, _reason: string): Promise<void> {
  const stats = await UserStats.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (stats) {
    (stats as any).totalXP = ((stats as any).totalXP || 0) + amount;
    await stats.save();
  }
}

export async function getTopPerformers(timeRange: 'day' | 'week' | 'month' = 'week', limit = 10) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'day':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const stats = await UserStats.find({ lastActiveDate: { $gte: startDate } })
    .sort({ totalXP: -1 })
    .limit(limit)
    .lean();

  const userIds = stats.map((s: any) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  return stats.map((stat: any, index: number) => {
    const user = userMap.get(stat.userId?.toString() || '');
    return {
      rank: index + 1,
      userId: stat.userId?.toString() || '',
      name: user?.name || 'Anonymous',
      avatar: user?.avatar,
      xp: stat.totalXP || 0,
      streak: stat.currentStreak || 0,
      accuracy: stat.overallAccuracy || 0,
    };
  });
}