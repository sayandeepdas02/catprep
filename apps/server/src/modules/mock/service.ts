import { MockTest, MockAttempt, MockAnalysis, MockQuestion } from './models/index.js';
import { Question } from '../practice/models/index.js';
import { awardXP } from '../rewards/service.js';
import mongoose from 'mongoose';

interface SectionAnswer {
  answer: string | string[];
  time: number;
  status: 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'marked_answered';
  isCorrect?: boolean;
}

export async function getMockTests(filters: {
  type?: string;
  difficulty?: string;
  sectionType?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { type, difficulty, sectionType, page = 1, limit = 10, search } = filters;

  const query: Record<string, unknown> = { isActive: true };
  if (type) query.type = type;
  if (difficulty) query.difficulty = difficulty;
  if (sectionType) query.sectionType = sectionType;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [mocks, total] = await Promise.all([
    MockTest.find(query)
      .select('-sections.questionIds')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MockTest.countDocuments(query),
  ]);

  return { mocks, total, page, limit, hasMore: page * limit < total };
}

export async function getMockTestDetails(mockTestId: string): Promise<any> {
  const mock = await MockTest.findById(mockTestId).lean();
  if (!mock) throw new Error('Mock test not found');

  const questions = await Question.find({
    _id: { $in: mock.sections.flatMap(s => s.questionIds) },
    isActive: true,
  })
    .populate('topicId', 'name slug')
    .lean();

  const sections = mock.sections.map(section => ({
    ...section,
    questions: questions.filter(q =>
      section.questionIds.some(
        (qid: any) => qid.toString() === q._id.toString()
      )
    ),
  }));

  return { ...mock, sections };
}

export async function startMockTest(mockTestId: string, userId: string): Promise<any> {
  let attempt = await MockAttempt.findOne({ userId, mockTestId, status: 'in_progress' });
  if (attempt) return { attempt, isResumed: true };

  const mock = await MockTest.findById(mockTestId);
  if (!mock) throw new Error('Mock test not found');

  const sectionStates = mock.sections.map((section, index) => ({
    sectionIndex: index,
    sectionType: section.type,
    answers: {} as Record<string, SectionAnswer>,
    startTime: Date.now(),
    isLocked: false,
    questionStatuses: {} as Record<string, string>,
  }));

  attempt = await MockAttempt.create({
    userId,
    mockTestId,
    status: 'in_progress',
    currentSection: 0,
    currentQuestion: 0,
    sectionStates,
    startedAt: new Date(),
  });

  await MockTest.findByIdAndUpdate(mockTestId, { $inc: { attemptCount: 1 } });

  const questions = await Question.find({
    _id: { $in: mock.sections[0].questionIds },
    isActive: true,
  }).populate('topicId', 'name slug').lean();

  return {
    attempt,
    isResumed: false,
    questions: questions.map(q => ({
      ...q,
      correctAnswer: undefined,
    })),
    section: mock.sections[0],
  };
}

export async function getAttemptProgress(attemptId: string, userId: string): Promise<any> {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) throw new Error('Attempt not found');

  const mock = await MockTest.findById(attempt.mockTestId);
  if (!mock) throw new Error('Mock test not found');

  const currentSection = mock.sections[attempt.currentSection];
  const questionIds = currentSection.questionIds;

  const questions = await Question.find({
    _id: { $in: questionIds },
    isActive: true,
  }).populate('topicId', 'name slug').lean();

  return {
    attempt,
    mock,
    currentSection,
    currentQuestionIndex: attempt.currentQuestion,
    questions: questions.map(q => ({
      ...q,
      correctAnswer: undefined,
    })),
    answeredCount: Object.keys(attempt.sectionStates[attempt.currentSection]?.answers || {}).length,
    totalQuestions: currentSection.questions,
  };
}

export async function saveAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  answer: string | string[],
  timeSpent: number,
  status: string
) {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId, status: 'in_progress' });
  if (!attempt) throw new Error('Attempt not found or already completed');

  const sectionState = attempt.sectionStates[attempt.currentSection];
  if (sectionState.isLocked) throw new Error('Section is locked');

  const answerData = {
    answer,
    time: timeSpent,
    status: status as SectionAnswer['status'],
  };
  (sectionState.answers as unknown as Map<string, SectionAnswer>).set(questionId, answerData);
  (sectionState.questionStatuses as unknown as Map<string, string>).set(questionId, status);

  await attempt.save();
  return attempt;
}

export async function markForReview(
  attemptId: string,
  userId: string,
  questionId: string
) {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId, status: 'in_progress' });
  if (!attempt) throw new Error('Attempt not found');

  const sectionState = attempt.sectionStates[attempt.currentSection];
  const answersMap = sectionState.answers as unknown as Map<string, SectionAnswer>;
  const currentAnswer = answersMap.get(questionId);
  const currentStatus = currentAnswer?.status || 'not_answered';

  let newStatus: string;
  if (currentStatus === 'marked_review') {
    newStatus = 'not_answered';
  } else {
    newStatus = 'marked_review';
  }

  answersMap.set(questionId, {
    answer: currentAnswer?.answer || '',
    time: currentAnswer?.time || 0,
    status: newStatus as SectionAnswer['status'],
  });
  (sectionState.questionStatuses as unknown as Map<string, string>).set(questionId, newStatus);

  await attempt.save();
  return attempt;
}

export async function switchSection(
  attemptId: string,
  userId: string,
  sectionIndex: number,
  action: 'move' | 'submit'
): Promise<any> {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId, status: 'in_progress' });
  if (!attempt) throw new Error('Attempt not found');

  const currentSectionState = attempt.sectionStates[attempt.currentSection];

  if (action === 'submit') {
    if (sectionIndex < attempt.sectionStates.length - 1) {
      currentSectionState.isLocked = true;
      currentSectionState.endTime = Date.now();
    }
  }

  if (sectionIndex < 0 || sectionIndex >= attempt.sectionStates.length) {
    throw new Error('Invalid section index');
  }

  attempt.currentSection = sectionIndex;
  attempt.currentQuestion = 0;
  await attempt.save();

  const mock = await MockTest.findById(attempt.mockTestId);
  if (!mock) throw new Error('Mock test not found');

  const nextSection = mock.sections[sectionIndex];
  const questions = await Question.find({
    _id: { $in: nextSection.questionIds },
    isActive: true,
  }).populate('topicId', 'name slug').lean();

  return {
    currentSection: sectionIndex,
    questions: questions.map(q => ({
      ...q,
      correctAnswer: undefined,
    })),
    section: nextSection,
    isLocked: attempt.sectionStates[sectionIndex]?.isLocked || false,
  };
}

export async function submitMockTest(attemptId: string, userId: string) {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status !== 'in_progress') throw new Error('Already submitted');

  const mock = await MockTest.findById(attempt.mockTestId);
  if (!mock) throw new Error('Mock test not found');

  let totalScore = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  const sectionalScores: Record<string, number> = {};
  const topicStats: Record<string, { attempted: number; correct: number; time: number }> = {};

  for (let i = 0; i < mock.sections.length; i++) {
    const section = mock.sections[i];
    section.isLocked = true;
    attempt.sectionStates[i].isLocked = true;
    attempt.sectionStates[i].endTime = Date.now();

    sectionalScores[section.type] = 0;

    for (const [qId, answerData] of Object.entries(attempt.sectionStates[i].answers)) {
      if (answerData.status === 'not_visited' || answerData.status === 'not_answered') continue;

      totalAttempted++;
      const question = await Question.findById(qId);
      if (!question) continue;

      const isCorrect = checkAnswer(question.correctAnswer, answerData.answer);
      answerData.isCorrect = isCorrect;

      if (isCorrect) {
        totalCorrect++;
        totalScore += section.marksPerQuestion;
        sectionalScores[section.type] += section.marksPerQuestion;
      } else if (answerData.status !== 'marked_review') {
        totalWrong++;
        totalScore -= section.negativeMarks;
      }

      const topicId = question.topicId?.toString() || 'unknown';
      if (!topicStats[topicId]) topicStats[topicId] = { attempted: 0, correct: 0, time: 0 };
      topicStats[topicId].attempted++;
      if (isCorrect) topicStats[topicId].correct++;
      topicStats[topicId].time += answerData.time;
    }
  }

  attempt.totalScore = Math.max(0, totalScore);
  attempt.sectionalScores = sectionalScores;
  attempt.totalAttempted = totalAttempted;
  attempt.totalCorrect = totalCorrect;
  attempt.totalWrong = totalWrong;
  attempt.totalSkipped = mock.totalQuestions - totalAttempted;
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeTaken = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

  const totalAttempts = await MockAttempt.countDocuments({
    mockTestId: mock._id,
    status: 'completed',
  });
  const betterAttempts = await MockAttempt.countDocuments({
    mockTestId: mock._id,
    status: 'completed',
    totalScore: { $gt: attempt.totalScore },
  });
  attempt.percentile = totalAttempts > 1 ? ((totalAttempts - betterAttempts) / totalAttempts) * 100 : 100;

  await attempt.save();

  const sectionalAnalysis = await Promise.all(
    mock.sections.map(async (section, i) => {
      const state = attempt.sectionStates[i];
      const attempted = Object.values(state.answers).filter(a => a.status !== 'not_visited' && a.status !== 'not_answered').length;
      const correct = Object.values(state.answers).filter(a => a.isCorrect).length;
      const wrong = attempted - correct;
      const totalTime = Object.values(state.answers).reduce((sum, a) => sum + a.time, 0);

      return {
        sectionType: section.type,
        score: sectionalScores[section.type] || 0,
        maxScore: section.questions * section.marksPerQuestion,
        attempted,
        correct,
        wrong,
        accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
        avgTime: attempted > 0 ? totalTime / attempted : 0,
      };
    })
  );

  const previousAnalysis = await MockAnalysis.findOne({ userId, mockTestId: mock._id }).sort({ createdAt: -1 });

  const analysis = await MockAnalysis.create({
    userId,
    mockTestId: mock._id,
    attemptId: attempt._id,
    totalScore: attempt.totalScore,
    maxScore: mock.totalMarks,
    totalAttempted,
    totalCorrect,
    totalWrong,
    totalSkipped: attempt.totalSkipped,
    accuracy: totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0,
    speed: attempt.timeTaken / mock.totalQuestions,
    sectionalAnalysis,
    topicPerformance: [],
    timeDistribution: [],
    percentile: attempt.percentile,
    estimatedRank: betterAttempts + 1,
    totalParticipants: totalAttempts,
    difficultyBreakdown: {
      easy: { attempted: 0, correct: 0, accuracy: 0 },
      medium: { attempted: 0, correct: 0, accuracy: 0 },
      hard: { attempted: 0, correct: 0, accuracy: 0 },
    },
    improvementSuggestions: generateSuggestions(sectionalAnalysis, topicStats),
    strengths: identifyStrengths(sectionalAnalysis, topicStats),
    weakAreas: identifyWeakAreas(sectionalAnalysis, topicStats),
    comparedToLast: {
      scoreChange: previousAnalysis ? attempt.totalScore - previousAnalysis.totalScore : attempt.totalScore,
      accuracyChange: previousAnalysis
        ? (totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0) - previousAnalysis.accuracy
        : totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0,
      percentileChange: previousAnalysis ? attempt.percentile - previousAnalysis.percentile : attempt.percentile,
      trend: previousAnalysis
        ? attempt.percentile > previousAnalysis.percentile
          ? 'improving'
          : attempt.percentile < previousAnalysis.percentile
          ? 'declining'
          : 'stable'
        : 'stable',
    },
  });

  await MockTest.findByIdAndUpdate(mock._id, {
    avgScore: (mock.avgScore * mock.attemptCount + attempt.totalScore) / (mock.attemptCount + 1),
  });

  const xpEarned = Math.floor(attempt.totalScore * 2) + Math.floor(attempt.percentile);
  await awardXP(userId, xpEarned, 'Mock test completed', { mocksCompleted: 1 });

  return { attempt, analysis, xpEarned };
}

function checkAnswer(correct: string | string[], selected: string | string[]): boolean {
  if (Array.isArray(correct) && Array.isArray(selected)) {
    return correct.length === selected.length && correct.every(c => selected.includes(c));
  }
  if (Array.isArray(correct)) return correct.includes(selected as string);
  if (Array.isArray(selected)) return selected.includes(correct);
  return correct === selected;
}

function generateSuggestions(
  sectionalAnalysis: any[],
  topicStats: Record<string, { attempted: number; correct: number; time: number }>
): string[] {
  const suggestions: string[] = [];

  for (const section of sectionalAnalysis) {
    if (section.accuracy < 50) {
      suggestions.push(`Focus more on ${section.sectionType} - your accuracy is ${section.accuracy.toFixed(1)}%`);
    }
    if (section.avgTime > 120) {
      suggestions.push(`Improve time management in ${section.sectionType} section`);
    }
  }

  const lowPerformingTopics = Object.entries(topicStats)
    .filter(([, stats]) => stats.attempted >= 3 && (stats.correct / stats.attempted) < 0.5)
    .map(([topicId]) => topicId);

  if (lowPerformingTopics.length > 0) {
    suggestions.push('Practice more questions from topics you find difficult');
  }

  if (suggestions.length === 0) {
    suggestions.push('Keep up the good work! Maintain your practice routine');
  }

  return suggestions.slice(0, 5);
}

function identifyStrengths(sectionalAnalysis: any[], topicStats: Record<string, any>): string[] {
  const strengths: string[] = [];

  for (const section of sectionalAnalysis) {
    if (section.accuracy >= 70) {
      strengths.push(`Strong in ${section.sectionType} (${section.accuracy.toFixed(1)}% accuracy)`);
    }
  }

  return strengths.slice(0, 3);
}

function identifyWeakAreas(sectionalAnalysis: any[], topicStats: Record<string, any>): string[] {
  const weakAreas: string[] = [];

  for (const section of sectionalAnalysis) {
    if (section.accuracy < 50) {
      weakAreas.push(`${section.sectionType} needs improvement (${section.accuracy.toFixed(1)}% accuracy)`);
    }
  }

  return weakAreas.slice(0, 3);
}

export async function getMockAnalysis(attemptId: string, userId: string) {
  const attempt = await MockAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) throw new Error('Attempt not found');

  const analysis = await MockAnalysis.findOne({ attemptId }).populate('userId', 'name avatar').lean();
  if (!analysis) throw new Error('Analysis not found');

  return analysis;
}

export async function getMockHistory(userId: string, page = 1, limit = 10) {
  const [attempts, total] = await Promise.all([
    MockAttempt.find({ userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('mockTestId', 'title type difficulty totalQuestions totalMarks sections')
      .lean(),
    MockAttempt.countDocuments({ userId, status: 'completed' }),
  ]);

  const analyses = await MockAnalysis.find({
    userId,
    attemptId: { $in: attempts.map(a => a._id) },
  }).lean();

  const analysisMap = new Map(analyses.map(a => [a.attemptId.toString(), a]));

  return {
    attempts: attempts.map((attempt: any) => ({
      ...attempt,
      analysis: analysisMap.get(attempt._id.toString()) || null,
    })),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}