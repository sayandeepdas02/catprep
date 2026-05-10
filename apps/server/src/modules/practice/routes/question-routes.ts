import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import * as questionService from '../services/question-service.js';
import { z } from 'zod';
import { validate } from '../../../middleware/validate.js';
import mongoose from 'mongoose';

const router = Router();

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

const questionFiltersSchema = z.object({
  subject: z.string().optional(),
  topicIds: z.string().optional(),
  difficulties: z.string().optional(),
  types: z.string().optional(),
  isPyq: z.coerce.boolean().optional(),
  year: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

const createQuestionSchema = z.object({
  type: z.enum(['MCQ', 'MSQ', 'TITA']),
  subject: z.enum(['quant', 'lr', 'di', 'verbal']),
  topicId: z.string(),
  subtopic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionText: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedTime: z.number().optional(),
  source: z.string().optional(),
  year: z.number().optional(),
  isPyq: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

router.get('/', validate(questionFiltersSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      subject: req.query.subject as string,
      topicIds: req.query.topicIds ? (req.query.topicIds as string).split(',') : undefined,
      difficulties: req.query.difficulties ? (req.query.difficulties as string).split(',') : undefined,
      types: req.query.types ? (req.query.types as string).split(',') : undefined,
      isPyq: req.query.isPyq === 'true',
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };
    const result = await questionService.getQuestions(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/random', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      subject: req.query.subject as string,
      topicIds: req.query.topicIds ? (req.query.topicIds as string).split(',') : undefined,
      difficulties: req.query.difficulties ? (req.query.difficulties as string).split(',') : undefined,
      types: req.query.types ? (req.query.types as string).split(',') : undefined,
      isPyq: req.query.isPyq === 'true',
      questionCount: parseInt(req.query.count as string) || 10,
    };
    const questions = await questionService.getRandomQuestions(filters);
    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
});

router.get('/subjects', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await questionService.getSubjects();
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:slug/topics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = getParamAsString(req.params.slug);
    const topics = await questionService.getTopicsBySubject(slug);
    res.json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await questionService.getQuestionStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamAsString(req.params.id);
    const question = await questionService.getQuestionById(id);
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(createQuestionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await questionService.createQuestion({
      ...req.body,
      topicId: new mongoose.Types.ObjectId(req.body.topicId),
      createdBy: (req as any).user?.userId,
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamAsString(req.params.id);
    const question = await questionService.updateQuestion(id, req.body);
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamAsString(req.params.id);
    await questionService.deleteQuestion(id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;