import { Question, Topic, Subject, IQuestion } from '../models/index.js';
import { createError } from '../../../middleware/errorHandler.js';
import mongoose from 'mongoose';

interface QuestionFilters {
  subject?: string;
  topicIds?: string[];
  difficulties?: string[];
  types?: string[];
  isPyq?: boolean;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
  questionCount?: number;
}

interface QuestionListResponse {
  questions: unknown[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getQuestions(filters: QuestionFilters): Promise<QuestionListResponse> {
  const { subject, topicIds, difficulties, types, isPyq, year, search, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = { isActive: true };

  if (subject) query.subject = subject;
  if (topicIds?.length) query.topicId = { $in: topicIds };
  if (difficulties?.length) query.difficulty = { $in: difficulties };
  if (types?.length) query.type = { $in: types };
  if (isPyq !== undefined) query.isPyq = isPyq;
  if (year) query.year = year;
  if (search) {
    query.$or = [
      { questionText: { $regex: search, $options: 'i' } },
      { tags: { $in: [{ $regex: search, $options: 'i' }] } },
    ];
  }

  const skip = (page - 1) * limit;
  
  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('topicId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Question.countDocuments(query),
  ]);

  return {
    questions: questions as unknown[],
    total,
    page,
    limit,
    hasMore: skip + questions.length < total,
  };
}

export async function getQuestionById(id: string) {
  const question = await Question.findById(id).populate('topicId', 'name slug').lean();
  if (!question) throw createError('Question not found', 404);
  return question;
}

export async function getRandomQuestions(filters: QuestionFilters): Promise<unknown[]> {
  const { subject, topicIds, difficulties, types, isPyq, questionCount = 10 } = filters;

  const query: Record<string, unknown> = { isActive: true };

  if (subject) query.subject = subject;
  if (topicIds?.length) query.topicId = { $in: topicIds };
  if (difficulties?.length) query.difficulty = { $in: difficulties };
  if (types?.length) query.type = { $in: types };
  if (isPyq) query.isPyq = true;

  const questions = await Question.aggregate([
    { $match: query },
    { $sample: { size: questionCount } },
  ]);

  return questions;
}

export async function getSubjects() {
  return Subject.find().sort({ order: 1 }).lean();
}

export async function getTopicsBySubject(subjectSlug: string) {
  const subject = await Subject.findOne({ slug: subjectSlug });
  if (!subject) throw createError('Subject not found', 404);
  
  return Topic.find({ subjectId: subject._id }).sort({ order: 1 }).lean();
}

export async function createQuestion(data: Partial<IQuestion>) {
  const question = await Question.create({
    ...data,
    topicId: data.topicId ? new mongoose.Types.ObjectId(data.topicId as unknown as string) : undefined,
  });
  return question;
}

export async function updateQuestion(id: string, data: Partial<IQuestion>) {
  const question = await Question.findByIdAndUpdate(id, data, { new: true });
  if (!question) throw createError('Question not found', 404);
  return question;
}

export async function deleteQuestion(id: string) {
  const question = await Question.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!question) throw createError('Question not found', 404);
  return { success: true };
}

export async function getQuestionStats() {
  const [total, bySubject, byType, byDifficulty, byYear] = await Promise.all([
    Question.countDocuments({ isActive: true }),
    Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]),
    Question.aggregate([
      { $match: { isActive: true, isPyq: true } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return { total, bySubject, byType, byDifficulty, byYear };
}