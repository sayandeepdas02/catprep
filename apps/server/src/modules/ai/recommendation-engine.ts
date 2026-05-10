import mongoose from 'mongoose';
import { QuestionAttempt } from '../practice/models/index.js';
import { UserStats } from '../practice/models/index.js';
import { MockAnalysis } from '../mock/models/index.js';
import { Topic } from '../practice/models/index.js';

interface TopicPerformance {
  topicId: string;
  topicName: string;
  subject: string;
  attempted: number;
  correct: number;
  accuracy: number;
  avgTime: number;
  trend: 'improving' | 'declining' | 'stable';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Recommendation {
  type: 'weak_topic' | 'speed' | 'accuracy' | 'revision' | 'practice' | 'milestone' | 'streak';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  topicId?: string;
  subject?: string;
  icon: string;
  progress?: number;
  target?: number;
}

interface AIRecommendations {
  recommendations: Recommendation[];
  weakTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  dailyPractice: {
    subject: string;
    topic: string;
    questionCount: number;
    reason: string;
  }[];
  insights: {
    title: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
  revisionPlan: {
    topic: string;
    priority: number;
    lastPracticed: string;
    accuracy: number;
    reason: string;
  }[];
  overallScore: number;
  strengths: string[];
  improvements: string[];
}

export async function generateAIRecommendations(userId: string): Promise<AIRecommendations> {
  const userOid = new mongoose.Types.ObjectId(userId);

  const [userStats, attempts, mockAnalyses] = await Promise.all([
    UserStats.findOne({ userId: userOid }).lean(),
    QuestionAttempt.find({ userId: userOid }).sort({ attemptedAt: -1 }).limit(500).lean(),
    MockAnalysis.find({ userId: userOid }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const topicPerformance = await analyzeTopicPerformance(userOid, attempts);
  const weakTopics = topicPerformance.filter(t => t.accuracy < 60 && t.attempted >= 5);
  const strongTopics = topicPerformance.filter(t => t.accuracy >= 80 && t.attempted >= 5);

  const recommendations: Recommendation[] = [];
  
  for (const topic of weakTopics.slice(0, 3)) {
    recommendations.push({
      type: 'weak_topic',
      priority: 'high',
      title: `Improve ${topic.topicName}`,
      description: `Your accuracy in ${topic.topicName} is ${topic.accuracy.toFixed(1)}%. Focus on fundamentals first.`,
      action: `/practice?topic=${topic.topicId}`,
      topicId: topic.topicId,
      subject: topic.subject,
      icon: 'target',
    });
  }

  const slowAttempts = attempts.filter(a => a.timeTaken > 180 && !a.isCorrect);
  if (slowAttempts.length > 3) {
    recommendations.push({
      type: 'speed',
      priority: 'medium',
      title: 'Improve Time Management',
      description: `You spend too much time on ${slowAttempts.length} difficult questions. Practice quick elimination techniques.`,
      action: '/practice?mode=timed',
      icon: 'timer',
    });
  }

  if (weakTopics.length > 0) {
    recommendations.push({
      type: 'revision',
      priority: 'high',
      title: 'Schedule Revision',
      description: `You have ${weakTopics.length} topics that need revision. Create a revision schedule.`,
      action: '/dashboard/planner',
      icon: 'book-open',
    });
  }

  const recentMocks = mockAnalyses.slice(0, 3);
  if (recentMocks.length >= 2) {
    const latest = mockAnalyses[0];
    const previous = mockAnalyses[1];
    if (latest.percentile > previous.percentile + 5) {
      recommendations.push({
        type: 'milestone',
        priority: 'low',
        title: 'Great Progress!',
        description: `Your percentile improved from ${previous.percentile.toFixed(1)}% to ${latest.percentile.toFixed(1)}%. Keep it up!`,
        action: '/leaderboard',
        icon: 'trophy',
      });
    }
  }

  const dailyPractice = generateDailyPractice(weakTopics, strongTopics, userStats);
  const insights = generateInsights(userStats, weakTopics, strongTopics, attempts);
  const revisionPlan = generateRevisionPlan(weakTopics, strongTopics);
  const overallScore = calculateOverallScore(userStats, weakTopics, strongTopics, attempts);
  const strengths = identifyStrengths(strongTopics, userStats);
  const improvements = identifyImprovements(weakTopics, userStats);

  return {
    recommendations,
    weakTopics,
    strongTopics,
    dailyPractice,
    insights,
    revisionPlan,
    overallScore,
    strengths,
    improvements,
  };
}

async function analyzeTopicPerformance(userId: mongoose.Types.ObjectId, attempts: any[]): Promise<TopicPerformance[]> {
  const topicStats = new Map<string, {
    attempted: number;
    correct: number;
    totalTime: number;
    recentAttempts: { isCorrect: boolean; date: Date }[];
  }>();

  const topics = await Topic.find().populate('subjectId', 'name slug').lean();
  const topicMap = new Map(topics.map(t => [t._id.toString(), t]));

  for (const attempt of attempts) {
    const topicId = attempt.topicId?.toString();
    if (!topicId) continue;

    if (!topicStats.has(topicId)) {
      topicStats.set(topicId, { attempted: 0, correct: 0, totalTime: 0, recentAttempts: [] });
    }
    const stats = topicStats.get(topicId)!;
    stats.attempted++;
    if (attempt.isCorrect) stats.correct++;
    stats.totalTime += attempt.timeTaken || 0;
    stats.recentAttempts.push({ isCorrect: attempt.isCorrect, date: new Date(attempt.attemptedAt) });
  }

  const performance: TopicPerformance[] = [];
  for (const [topicId, stats] of topicStats) {
    const topic = topicMap.get(topicId);
    if (!topic) continue;

    const recentCorrect = stats.recentAttempts.slice(-5).filter(a => a.isCorrect).length;
    const olderCorrect = stats.recentAttempts.slice(-10, -5).filter(a => a.isCorrect).length;
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (stats.recentAttempts.length >= 10) {
      if (recentCorrect > olderCorrect) trend = 'improving';
      else if (recentCorrect < olderCorrect) trend = 'declining';
    }

    performance.push({
      topicId,
      topicName: topic.name,
      subject: (topic.subjectId as any)?.name || 'Unknown',
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
      avgTime: stats.attempted > 0 ? stats.totalTime / stats.attempted : 0,
      trend,
      difficulty: 'medium',
    });
  }

  return performance.sort((a, b) => a.accuracy - b.accuracy);
}

function generateDailyPractice(
  weakTopics: TopicPerformance[],
  strongTopics: TopicPerformance[],
  userStats: any
): { subject: string; topic: string; questionCount: number; reason: string }[] {
  const dailyPractice = [];

  for (const topic of weakTopics.slice(0, 2)) {
    dailyPractice.push({
      subject: topic.subject,
      topic: topic.topicName,
      questionCount: Math.max(5, Math.floor(10 - topic.accuracy / 10)),
      reason: `Focus on improving your accuracy in ${topic.topicName}`,
    });
  }

  if (userStats?.dailyGoal && userStats.dailyGoal > dailyPractice.reduce((sum, d) => sum + d.questionCount, 0)) {
    const remaining = userStats.dailyGoal - dailyPractice.reduce((sum, d) => sum + d.questionCount, 0);
    if (strongTopics.length > 0) {
      dailyPractice.push({
        subject: strongTopics[0].subject,
        topic: strongTopics[0].topicName,
        questionCount: remaining,
        reason: 'Maintain your strength in this topic',
      });
    }
  }

  return dailyPractice;
}

function generateInsights(
  userStats: any,
  weakTopics: TopicPerformance[],
  strongTopics: TopicPerformance[],
  attempts: any[]
): { title: string; value: string; trend: 'up' | 'down' | 'neutral' }[] {
  const insights: { title: string; value: string; trend: 'up' | 'down' | 'neutral' }[] = [];

  const avgTime = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length
    : 0;

  insights.push({
    title: 'Avg. Time per Question',
    value: `${Math.floor(avgTime)}s`,
    trend: avgTime < 120 ? 'up' : avgTime > 180 ? 'down' : 'neutral',
  });

  if (userStats?.overallAccuracy !== undefined) {
    insights.push({
      title: 'Overall Accuracy',
      value: `${userStats.overallAccuracy.toFixed(1)}%`,
      trend: userStats.overallAccuracy >= 70 ? 'up' : 'down',
    });
  }

  insights.push({
    title: 'Topics to Focus',
    value: `${weakTopics.length}`,
    trend: weakTopics.length <= 3 ? 'up' : 'down',
  });

  if (userStats?.totalQuestionsSolved) {
    insights.push({
      title: 'Questions Solved',
      value: `${userStats.totalQuestionsSolved}`,
      trend: 'neutral',
    });
  }

  return insights;
}

function generateRevisionPlan(
  weakTopics: TopicPerformance[],
  strongTopics: TopicPerformance[]
): { topic: string; priority: number; lastPracticed: string; accuracy: number; reason: string }[] {
  const plan = [];

  for (const topic of weakTopics) {
    plan.push({
      topic: topic.topicName,
      priority: Math.max(1, Math.floor((100 - topic.accuracy) / 10)),
      lastPracticed: 'Recently',
      accuracy: topic.accuracy,
      reason: `${topic.accuracy.toFixed(0)}% accuracy - needs urgent revision`,
    });
  }

  for (const topic of strongTopics) {
    if (topic.trend === 'declining') {
      plan.push({
        topic: topic.topicName,
        priority: 5,
        lastPracticed: 'Recently',
        accuracy: topic.accuracy,
        reason: 'Accuracy declining - schedule quick review',
      });
    }
  }

  return plan.sort((a, b) => b.priority - a.priority).slice(0, 7);
}

function calculateOverallScore(
  userStats: any,
  weakTopics: TopicPerformance[],
  strongTopics: TopicPerformance[],
  attempts: any[]
): number {
  let score = 50;

  if (userStats?.overallAccuracy) {
    score += (userStats.overallAccuracy - 50) * 0.3;
  }

  score -= weakTopics.length * 3;
  score += strongTopics.length * 2;

  const recentAttempts = attempts.slice(0, 20);
  if (recentAttempts.length > 0) {
    const recentAccuracy = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length * 100;
    score += (recentAccuracy - 50) * 0.2;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function identifyStrengths(strongTopics: TopicPerformance[], userStats: any): string[] {
  const strengths = [];

  if (strongTopics.length >= 3) {
    strengths.push(`Strong in ${strongTopics.slice(0, 3).map(t => t.topicName).join(', ')}`);
  }

  if (userStats?.overallAccuracy >= 80) {
    strengths.push('Excellent overall accuracy');
  }

  if (strongTopics.some(t => t.trend === 'improving')) {
    strengths.push('Consistent improvement in several topics');
  }

  return strengths;
}

function identifyImprovements(weakTopics: TopicPerformance[], userStats: any): string[] {
  const improvements = [];

  if (weakTopics.length > 0) {
    improvements.push(`Focus on ${weakTopics[0].topicName} - only ${weakTopics[0].accuracy.toFixed(0)}% accuracy`);
  }

  if (weakTopics.some(t => t.trend === 'declining')) {
    improvements.push('Some topics showing declining performance - needs attention');
  }

  if (!userStats?.streak || userStats.streak < 3) {
    improvements.push('Build a consistent study streak');
  }

  return improvements;
}

export async function getTopicRecommendations(topicId: string, userId: string): Promise<any> {
  const userOid = new mongoose.Types.ObjectId(userId);
  
  const attempts = await QuestionAttempt.find({
    userId: userOid,
    topicId: new mongoose.Types.ObjectId(topicId),
  }).sort({ attemptedAt: -1 }).limit(50).lean();

  const topic = await Topic.findById(topicId).populate('subjectId', 'name slug').lean();
  
  const correct = attempts.filter(a => a.isCorrect).length;
  const accuracy = attempts.length > 0 ? (correct / attempts.length) * 100 : 0;
  const avgTime = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length
    : 0;

  const recommendations = [];

  if (accuracy < 50) {
    recommendations.push({
      type: 'fundamental',
      title: 'Review Fundamentals',
      description: 'Go back to basic concepts before attempting more questions.',
      priority: 'high',
    });
    recommendations.push({
      type: 'easier',
      title: 'Start with Easier Questions',
      description: 'Build confidence with simpler questions first.',
      priority: 'high',
    });
  } else if (accuracy < 70) {
    recommendations.push({
      type: 'practice',
      title: 'Practice More Questions',
      description: 'Focus on understanding patterns and common question types.',
      priority: 'medium',
    });
    recommendations.push({
      type: 'time',
      title: 'Time Management',
      description: 'Work on reducing time per question while maintaining accuracy.',
      priority: 'medium',
    });
  } else if (accuracy >= 70) {
    recommendations.push({
      type: 'advanced',
      title: 'Challenge Yourself',
      description: 'Try harder questions and time-bound practice.',
      priority: 'low',
    });
  }

  if (avgTime > 180) {
    recommendations.push({
      type: 'speed',
      title: 'Speed Practice',
      description: 'Set a timer and try to answer faster without compromising accuracy.',
      priority: accuracy < 70 ? 'medium' : 'high',
    });
  }

  return {
    topic: topic ? { name: topic.name, subject: (topic.subjectId as any)?.name } : null,
    stats: { attempted: attempts.length, correct, accuracy, avgTime },
    recommendations,
  };
}
