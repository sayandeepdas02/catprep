import { User } from '../user/model.js';
import { UserStats } from '../practice/models/index.js';
import { BattleResult } from '../battle/models/index.js';
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
      weeklyXp: stat.weeklySolved?.reduce((a: number, b: number) => a + b, 0) || 0,
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
  const { MockAttempt } = await import('../mock/models/index.js');
  
  const attempts = await MockAttempt.find({ mockTestId: new mongoose.Types.ObjectId(mockTestId) })
    .sort({ percentile: -1 })
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
      accuracy: 0,
      totalSolved: 0,
      weeklyXp: 0,
      mockRank: index + 1,
    };
  });
}

export async function getBattleLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const results = await BattleResult.find({ completedAt: { $gte: weekAgo } }).lean();
  
  const userPoints = new Map<string, number>();
  const userWins = new Map<string, number>();
  
  for (const result of results) {
    for (const participant of result.participants) {
      const userId = participant.userId.toString();
      userPoints.set(userId, (userPoints.get(userId) || 0) + participant.score);
      if (result.winnerId.toString() === userId) {
        userWins.set(userId, (userWins.get(userId) || 0) + 1);
      }
    }
  }

  const sorted = Array.from(userPoints.entries())
    .map(([userId, xp]) => ({
      userId,
      xp,
      wins: userWins.get(userId) || 0,
    }))
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
      battleRank: index + 1,
    };
  });
}

export async function getUserRank(userId: string): Promise<{ global: number; weekly: number; battle?: number }> {
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

  return { global: globalRank, weekly: weeklyRank };
}

export async function awardXP(userId: string, amount: number, _reason: string): Promise<void> {
  const stats = await UserStats.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (stats) {
    (stats as any).totalXP = ((stats as any).totalXP || 0) + amount;
    await stats.save();
  }
}