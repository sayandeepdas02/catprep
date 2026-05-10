import mongoose from 'mongoose';
import { StudyGoal, StudySession, PomodoroSession, Todo, UserActivity, SystemLog, SearchQuery } from '../models/index.js';
import { UserStats } from '../../practice/models/index.js';
import { MockAnalysis } from '../../mock/models/index.js';
import { Question } from '../../practice/models/index.js';
import { Topic } from '../../practice/models/index.js';

export async function trackUserActivity(userId: string, data: {
  type: 'study' | 'mock' | 'battle' | 'pomodoro' | 'todo';
  duration?: number;
  questionsSolved?: number;
  xpEarned?: number;
  subject?: string;
}) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activity = await UserActivity.findOneAndUpdate(
    { userId: userOid, date: today },
    {
      $inc: {
        totalStudyTime: data.duration || 0,
        questionsSolved: data.questionsSolved || 0,
        xpEarned: data.xpEarned || 0,
        mocksCompleted: data.type === 'mock' ? 1 : 0,
        battlesPlayed: data.type === 'battle' ? 1 : 0,
        pomodoroSessions: data.type === 'pomodoro' ? 1 : 0,
        todosCompleted: data.type === 'todo' ? 1 : 0,
      },
      $setOnInsert: { userId: userOid, date: today },
    },
    { upsert: true, new: true }
  );

  return activity;
}

export async function getStudyStats(userId: string, days = 30) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const activities = await UserActivity.find({
    userId: userOid,
    date: { $gte: startDate },
  }).sort({ date: 1 }).lean();

  const totalStudyTime = activities.reduce((sum, a) => sum + (a.totalStudyTime || 0), 0);
  const totalQuestions = activities.reduce((sum, a) => sum + (a.questionsSolved || 0), 0);
  const totalMocks = activities.reduce((sum, a) => sum + (a.mocksCompleted || 0), 0);
  const totalBattles = activities.reduce((sum, a) => sum + (a.battlesPlayed || 0), 0);
  const totalXp = activities.reduce((sum, a) => sum + (a.xpEarned || 0), 0);

  const avgDailyTime = activities.length > 0 ? totalStudyTime / activities.length : 0;
  const consistency = activities.length / days * 100;

  return {
    totalStudyTime,
    totalQuestions,
    totalMocks,
    totalBattles,
    totalXp,
    avgDailyTime,
    consistency: Math.round(consistency),
    dailyData: activities.map(a => ({
      date: a.date,
      studyTime: a.totalStudyTime,
      questions: a.questionsSolved,
      xp: a.xpEarned,
    })),
  };
}

export async function getAdvancedAnalytics(userId: string) {
  const userOid = new mongoose.Types.ObjectId(userId);

  const [userStats, mockAnalyses, recentActivity] = await Promise.all([
    UserStats.findOne({ userId: userOid }).lean(),
    MockAnalysis.find({ userId: userOid }).sort({ createdAt: -1 }).limit(20).lean(),
    UserActivity.find({ userId: userOid }).sort({ date: -1 }).limit(30).lean(),
  ]);

  const topicAccuracyData: Record<string, { accuracy: number; questions: number; time: number }> = {};
  const subjectData: Record<string, { time: number; questions: number; correct: number }> = {};
  const dailyStreak = calculateStreak(recentActivity);
  const percentileTrend = mockAnalyses.length >= 2
    ? mockAnalyses[0].percentile - mockAnalyses[mockAnalyses.length - 1].percentile
    : 0;

  for (const activity of recentActivity) {
    if (activity.subjects) {
      for (const [subject, data] of Object.entries(activity.subjects)) {
        const sd = data as any;
        if (!subjectData[subject]) subjectData[subject] = { time: 0, questions: 0, correct: 0 };
        subjectData[subject].time += sd.time || 0;
        subjectData[subject].questions += sd.questions || 0;
        subjectData[subject].correct += Math.round((sd.accuracy || 0) * (sd.questions || 0) / 100);
      }
    }
  }

  const subjectBreakdown = Object.entries(subjectData).map(([subject, data]) => ({
    subject,
    time: data.time,
    questions: data.questions,
    accuracy: data.questions > 0 ? (data.correct / data.questions) * 100 : 0,
  }));

  return {
    overall: {
      accuracy: userStats?.overallAccuracy || 0,
      questionsSolved: userStats?.totalQuestionsSolved || 0,
      avgTime: userStats?.totalStudyTime && userStats?.totalQuestionsSolved
        ? userStats.totalStudyTime / userStats.totalQuestionsSolved
        : 0,
      currentStreak: dailyStreak,
    },
    mockPerformance: mockAnalyses.map((m: any) => ({
      date: m.createdAt,
      score: m.totalScore,
      percentile: m.percentile,
      accuracy: m.accuracy,
    })),
    subjectBreakdown,
    percentileTrend,
    radarData: generateRadarData(subjectData),
    heatmapData: generateHeatmapData(recentActivity),
    speedAccuracyData: generateSpeedAccuracyData(userStats),
  };
}

function calculateStreak(activities: any[]): number {
  if (activities.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);

  const activityDates = new Set(
    activities.map(a => {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (activityDates.has(currentDate.getTime()) || streak === 0) {
    if (activityDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (streak === 0) {
      currentDate.setDate(currentDate.getDate() - 1);
      if (activityDates.has(currentDate.getTime())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

function generateRadarData(subjectData: Record<string, any>) {
  const labels = Object.keys(subjectData);
  return labels.map(label => ({
    subject: label,
    accuracy: subjectData[label].questions > 0
      ? (subjectData[label].correct / subjectData[label].questions) * 100
      : 0,
    time: subjectData[label].time,
    volume: subjectData[label].questions,
  }));
}

function generateHeatmapData(activities: any[]) {
  return activities.map(a => ({
    date: a.date,
    value: a.totalStudyTime || 0,
    intensity: Math.min(1, (a.totalStudyTime || 0) / 3600),
  }));
}

function generateSpeedAccuracyData(userStats: any) {
  if (!userStats) return [];
  
  const buckets = [
    { range: '0-60s', accuracy: 0, count: 0 },
    { range: '60-90s', accuracy: 0, count: 0 },
    { range: '90-120s', accuracy: 0, count: 0 },
    { range: '120-180s', accuracy: 0, count: 0 },
    { range: '180s+', accuracy: 0, count: 0 },
  ];

  return buckets;
}

export async function globalSearch(query: string, userId?: string) {
  const startTime = Date.now();
  const results = {
    questions: [] as any[],
    topics: [] as any[],
    mocks: [] as any[],
    bookmarks: [] as any[],
  };

  const searchRegex = new RegExp(query, 'i');

  try {
    const [questions, topics, mocks] = await Promise.all([
      Question.find({ questionText: searchRegex, isActive: true })
        .select('questionText type difficulty subject')
        .limit(10)
        .lean(),
      Topic.find({ name: searchRegex })
        .select('name description')
        .limit(5)
        .lean(),
      (async () => {
        const { MockTest } = await import('../../mock/models/index.js');
        return MockTest.find({ title: searchRegex, isActive: true })
          .select('title type difficulty totalQuestions')
          .limit(5)
          .lean();
      })(),
    ]);

    results.questions = questions;
    results.topics = topics;
    results.mocks = mocks;

    if (userId) {
      const { Bookmark } = await import('../../practice/models/index.js');
      results.bookmarks = await Bookmark.find({
        userId: new mongoose.Types.ObjectId(userId),
        'questionId.questionText': searchRegex,
      }).populate('questionId', 'questionText type difficulty').limit(5).lean();
    }

    const responseTime = Date.now() - startTime;

    await SearchQuery.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      query,
      results: {
        questions: results.questions.length,
        topics: results.topics.length,
        mocks: results.mocks.length,
        bookmarks: results.bookmarks.length,
      },
      responseTime,
      timestamp: new Date(),
    });

    return {
      ...results,
      total: results.questions.length + results.topics.length + results.mocks.length + results.bookmarks.length,
      responseTime,
    };
  } catch (error) {
    console.error('Search error:', error);
    return { ...results, total: 0, responseTime: Date.now() - startTime };
  }
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  return SystemLog.create({ level: 'info', message, meta, timestamp: new Date() });
}

export function logError(message: string, meta?: Record<string, unknown>) {
  return SystemLog.create({ level: 'error', message, meta, timestamp: new Date() });
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  return SystemLog.create({ level: 'warn', message, meta, timestamp: new Date() });
}
