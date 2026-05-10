import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import * as practiceService from '../services/practice-service.js';
import * as analyticsService from '../services/analytics-service.js';
import { z } from 'zod';
import { validate } from '../../../middleware/validate.js';

const router = Router();

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

function getParamAsStringArray(param: string | string[] | undefined): string[] {
  if (Array.isArray(param)) return param;
  if (param) return [param];
  return [];
}

const startSessionSchema = z.object({
  mode: z.enum(['topic', 'timed', 'accuracy', 'pyq']),
  subjects: z.array(z.string()).optional(),
  topicIds: z.array(z.string()).optional(),
  difficulties: z.array(z.string()).optional(),
  questionTypes: z.array(z.string()).optional(),
  timeLimit: z.number().optional(),
  questionCount: z.number().optional(),
  isPyq: z.boolean().optional(),
});

const submitAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  selectedAnswer: z.union([z.string(), z.array(z.string())]),
  timeTaken: z.number(),
  isMarkedForReview: z.boolean().optional(),
  isSkipped: z.boolean().optional(),
});

const bookmarkSchema = z.object({
  questionId: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const notesSchema = z.object({
  questionId: z.string(),
  content: z.string(),
  approach: z.string().optional(),
  formula: z.string().optional(),
});

router.post('/session/start', authenticate, validate(startSessionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await practiceService.startSession({
      userId: (req as any).user?.userId,
      ...req.body,
    });
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

router.post('/session/submit', authenticate, validate(submitAnswerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attempt = await practiceService.submitAnswer({
      userId: (req as any).user?.userId,
      ...req.body,
    });
    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
});

router.post('/session/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getParamAsString(req.params.id);
    const result = await practiceService.completeSession(sessionId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/session/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getParamAsString(req.params.id);
    const session = await practiceService.getSessionById(sessionId, (req as any).user?.userId);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

router.get('/session/:id/questions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getParamAsString(req.params.id);
    const questions = await practiceService.getSessionQuestions(sessionId);
    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await practiceService.getUserSessions((req as any).user?.userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/bookmarks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await practiceService.getUserBookmarks((req as any).user?.userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/bookmarks', authenticate, validate(bookmarkSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookmark = await practiceService.addBookmark(
      (req as any).user?.userId,
      req.body.questionId,
      req.body.notes,
      req.body.tags
    );
    res.json({ success: true, data: bookmark });
  } catch (error) {
    next(error);
  }
});

router.delete('/bookmarks/:questionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questionId = getParamAsString(req.params.questionId);
    await practiceService.removeBookmark((req as any).user?.userId, questionId);
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
});

router.get('/bookmarks/:questionId/check', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questionId = getParamAsString(req.params.questionId);
    const isBookmarked = await practiceService.isBookmarked((req as any).user?.userId, questionId);
    res.json({ success: true, data: { isBookmarked } });
  } catch (error) {
    next(error);
  }
});

router.get('/notes', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await practiceService.getUserNotes((req as any).user?.userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/notes/:questionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questionId = getParamAsString(req.params.questionId);
    const notes = await practiceService.getNotes((req as any).user?.userId, questionId);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
});

router.post('/notes', authenticate, validate(notesSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await practiceService.saveNotes(
      (req as any).user?.userId,
      req.body.questionId,
      req.body.content,
      req.body.approach,
      req.body.formula
    );
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (_req as any).user?.userId;
    const analytics = await analyticsService.getUserAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/topic/:topicId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topicId = getParamAsString(req.params.topicId);
    const analytics = await analyticsService.getTopicAnalytics(
      (req as any).user?.userId,
      topicId
    );
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await analyticsService.getLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

export default router;