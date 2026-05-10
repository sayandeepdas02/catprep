import { QuestionAttempt, PracticeSession, Question, UserStats, Bookmark, UserNotes } from '../models/index.js';
import { createError } from '../../../middleware/errorHandler.js';
import mongoose from 'mongoose';

interface StartSessionData {
  userId: string;
  mode: 'topic' | 'timed' | 'accuracy' | 'pyq';
  subjects?: string[];
  topicIds?: string[];
  difficulties?: string[];
  questionTypes?: string[];
  timeLimit?: number;
  questionCount?: number;
  isPyq?: boolean;
}

interface SubmitAnswerData {
  userId: string;
  sessionId: string;
  questionId: string;
  selectedAnswer: string | string[];
  timeTaken: number;
  isMarkedForReview?: boolean;
  isSkipped?: boolean;
}

export async function startSession(data: StartSessionData) {
  const session = await PracticeSession.create({
    userId: data.userId,
    mode: data.mode,
    status: 'in_progress',
    subjects: data.subjects,
    topicIds: data.topicIds?.map((id) => new mongoose.Types.ObjectId(id)),
    difficulties: data.difficulties,
    questionTypes: data.questionTypes,
    timeLimit: data.timeLimit,
    questionCount: data.questionCount,
    isPyq: data.isPyq,
    startedAt: new Date(),
  });

  return session;
}

export async function submitAnswer(data: SubmitAnswerData) {
  const question = await Question.findById(data.questionId);
  if (!question) throw createError('Question not found', 404);

  const isCorrect = checkAnswer(question.correctAnswer, data.selectedAnswer);
  const isSkipped = data.isSkipped || !data.selectedAnswer;

  const attempt = await QuestionAttempt.create({
    userId: data.userId,
    questionId: data.questionId,
    sessionId: data.sessionId,
    type: question.type,
    subject: question.subject,
    topicId: question.topicId,
    difficulty: question.difficulty,
    selectedAnswer: data.selectedAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect: isSkipped ? false : isCorrect,
    timeTaken: data.timeTaken,
    isMarkedForReview: data.isMarkedForReview || false,
    isSkipped,
  });

  return attempt;
}

function checkAnswer(correctAnswer: string | string[], selectedAnswer: string | string[]): boolean {
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(selectedAnswer)) return false;
    const sortedCorrect = [...correctAnswer].sort();
    const sortedSelected = [...selectedAnswer].sort();
    return sortedCorrect.length === sortedSelected.length &&
      sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
  }
  return correctAnswer === selectedAnswer;
}

export async function completeSession(sessionId: string) {
  const session = await PracticeSession.findById(sessionId);
  if (!session) throw createError('Session not found', 404);

  const attempts = await QuestionAttempt.find({ sessionId });
  
  const answered = attempts.filter(a => !a.isSkipped);
  const correct = attempts.filter(a => a.isCorrect);
  const totalTime = attempts.reduce((sum, a) => sum + a.timeTaken, 0);

  session.status = 'completed';
  session.completedAt = new Date();
  session.answeredQuestions = answered.length;
  session.correctAnswers = correct.length;
  session.totalTime = totalTime;
  session.totalQuestions = attempts.length;

  await session.save();

  return {
    session,
    attempts,
    stats: {
      total: attempts.length,
      answered: answered.length,
      correct: correct.length,
      accuracy: answered.length > 0 ? (correct.length / answered.length) * 100 : 0,
      totalTime,
    },
  };
}

export async function getSessionById(sessionId: string, userId: string) {
  const session = await PracticeSession.findOne({ _id: sessionId, userId });
  if (!session) throw createError('Session not found', 404);
  return session;
}

export async function getUserSessions(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    PracticeSession.find({ userId })
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PracticeSession.countDocuments({ userId }),
  ]);

  return { sessions, total, page, limit, hasMore: skip + sessions.length < total };
}

export async function getSessionQuestions(sessionId: string) {
  const attempts = await QuestionAttempt.find({ sessionId })
    .populate('questionId')
    .lean();
  
  return attempts as unknown as Array<{
    _id: string;
    userId: string;
    questionId: unknown;
    type: string;
    subject: string;
    topicId: string;
    difficulty: string;
    selectedAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    timeTaken: number;
    isMarkedForReview: boolean;
    isSkipped: boolean;
    attemptedAt: Date;
  }>;
}

export async function addBookmark(userId: string, questionId: string, notes?: string, tags?: string[]) {
  const bookmark = await Bookmark.findOneAndUpdate(
    { userId, questionId },
    { notes, tags },
    { upsert: true, new: true }
  );
  return bookmark;
}

export async function removeBookmark(userId: string, questionId: string) {
  await Bookmark.findOneAndDelete({ userId, questionId });
  return { success: true };
}

export async function getUserBookmarks(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [bookmarks, total] = await Promise.all([
    Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('questionId')
      .lean(),
    Bookmark.countDocuments({ userId }),
  ]);

  return { bookmarks, total, page, limit, hasMore: skip + bookmarks.length < total };
}

export async function isBookmarked(userId: string, questionId: string) {
  const bookmark = await Bookmark.findOne({ userId, questionId });
  return !!bookmark;
}

export async function saveNotes(userId: string, questionId: string, content: string, approach?: string, formula?: string) {
  const notes = await UserNotes.findOneAndUpdate(
    { userId, questionId },
    { content, approach, formula },
    { upsert: true, new: true }
  );
  return notes;
}

export async function getNotes(userId: string, questionId: string) {
  const notes = await UserNotes.findOne({ userId, questionId });
  return notes;
}

export async function getUserNotes(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [notes, total] = await Promise.all([
    UserNotes.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('questionId')
      .lean(),
    UserNotes.countDocuments({ userId }),
  ]);

  return { notes, total, page, limit, hasMore: skip + notes.length < total };
}