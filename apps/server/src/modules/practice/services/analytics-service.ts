import { QuestionAttempt, UserStats, PracticeSession, Question } from '../models/index.js';
import mongoose from 'mongoose';

export async function getOrCreateUserStats(userId: string) {
  let stats = await UserStats.findOne({ userId });
  if (!stats) {
    stats = await UserStats.create({ userId });
  }
  return stats;
}

export async function updateUserStats(userId: string) {
  const attempts = await QuestionAttempt.find({ userId }).lean();
  
  const totalSolved = attempts.filter(a => !a.isSkipped).length;
  const totalCorrect = attempts.filter(a => a.isCorrect).length;
  const totalTime = attempts.reduce((sum, a) => sum + a.timeTaken, 0);
  const accuracy = totalSolved > 0 ? (totalCorrect / totalSolved) * 100 : 0;

  const subjectStats = await calculateSubjectStats(userId);
  const topicStats = await calculateTopicStats(userId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dailySolved = attempts.filter(a => {
    const attemptDate = new Date(a.attemptedAt);
    attemptDate.setHours(0, 0, 0, 0);
    return attemptDate.getTime() === today.getTime();
  }).filter(a => !a.isSkipped).length;

  const lastActive = await QuestionAttempt.findOne({ userId }).sort({ attemptedAt: -1 }).lean();
  const lastActiveDate = lastActive ? new Date(lastActive.attemptedAt) : null;
  
  let currentStreak = 0;
  if (lastActiveDate) {
    const checkDate = new Date(today);
    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const hasAttempts = await QuestionAttempt.exists({
        userId,
        attemptedAt: { $gte: dayStart, $lte: dayEnd },
        isSkipped: false,
      });
      
      if (hasAttempts) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (checkDate.getTime() === today.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const updateData: any = {
    totalQuestionsSolved: totalSolved,
    totalCorrect: totalCorrect,
    overallAccuracy: accuracy,
    totalStudyTime: totalTime,
    currentStreak,
    lastActiveDate,
    dailySolved,
  };

  if (currentStreak > (await getOrCreateUserStats(userId)).longestStreak) {
    updateData.longestStreak = currentStreak;
  }

  await UserStats.findOneAndUpdate({ userId }, { $set: updateData, subjectStats, topicStats });
  
  return updateData;
}

async function calculateSubjectStats(userId: string) {
  const attempts = await QuestionAttempt.find({ userId }).lean();
  
  const subjectMap = new Map<string, { total: number; correct: number; time: number }>();
  
  for (const attempt of attempts) {
    const existing = subjectMap.get(attempt.subject) || { total: 0, correct: 0, time: 0 };
    if (!attempt.isSkipped) {
      existing.total++;
      if (attempt.isCorrect) existing.correct++;
      existing.time += attempt.timeTaken;
    }
    subjectMap.set(attempt.subject, existing);
  }

  return Array.from(subjectMap.entries()).map(([subject, stats]) => ({
    subject,
    totalAttempted: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    avgTime: stats.total > 0 ? stats.time / stats.total : 0,
  }));
}

async function calculateTopicStats(userId: string) {
  const attempts = await QuestionAttempt.find({ userId }).lean();
  
  const topicMap = new Map<string, { total: number; correct: number; time: number }>();
  
  for (const attempt of attempts) {
    const topicId = attempt.topicId.toString();
    const existing = topicMap.get(topicId) || { total: 0, correct: 0, time: 0 };
    if (!attempt.isSkipped) {
      existing.total++;
      if (attempt.isCorrect) existing.correct++;
      existing.time += attempt.timeTaken;
    }
    topicMap.set(topicId, existing);
  }

  return Object.fromEntries(
    Array.from(topicMap.entries()).map(([topicId, stats]) => [
      topicId,
      {
        topicId: new mongoose.Types.ObjectId(topicId),
        totalAttempted: stats.total,
        correct: stats.correct,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        avgTime: stats.total > 0 ? stats.time / stats.total : 0,
      },
    ])
  );
}

export async function getUserAnalytics(userId: string) {
  const stats = await getOrCreateUserStats(userId);
  
  const recentSessions = await PracticeSession.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  const weeklyAttempts = await QuestionAttempt.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        attemptedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: '$attemptedAt' },
        count: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
      },
    },
  ]);

  const topicPerformance = Object.entries(stats.topicStats || {})
    .map(([topicId, data]: [string, any]) => ({
      topicId: new mongoose.Types.ObjectId(topicId),
      ...data,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakTopics = topicPerformance.slice(0, 5).filter(t => t.totalAttempted >= 5);
  const strongTopics = topicPerformance.slice(-5).reverse().filter(t => t.totalAttempted >= 5);

  return {
    overall: stats,
    recentSessions,
    weeklyAttempts,
    weakTopics,
    strongTopics,
    subjectStats: stats.subjectStats || [],
  };
}

export async function getTopicAnalytics(userId: string, topicId: string) {
  const attempts = await QuestionAttempt.find({
    userId,
    topicId: new mongoose.Types.ObjectId(topicId),
  }).lean();

  const total = attempts.filter(a => !a.isSkipped).length;
  const correct = attempts.filter(a => a.isCorrect).length;
  const avgTime = attempts.reduce((sum, a) => sum + a.timeTaken, 0) / total || 0;

  const byDifficulty = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };

  for (const attempt of attempts) {
    if (!attempt.isSkipped) {
      byDifficulty[attempt.difficulty as keyof typeof byDifficulty].total++;
      if (attempt.isCorrect) {
        byDifficulty[attempt.difficulty as keyof typeof byDifficulty].correct++;
      }
    }
  }

  return {
    total,
    correct,
    accuracy: total > 0 ? (correct / total) * 100 : 0,
    avgTime,
    byDifficulty,
  };
}

export async function getLeaderboard(limit = 20) {
  const leaderboard = await UserStats.find()
    .sort({ totalXP: -1, overallAccuracy: -1 })
    .limit(limit)
    .lean();

  return leaderboard;
}