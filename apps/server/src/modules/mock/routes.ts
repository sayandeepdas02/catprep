import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as mockService from './service.js';

const router = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, difficulty, sectionType, page, limit, search } = req.query;
    const result = await mockService.getMockTests({
      type: getParam(type as string | string[]),
      difficulty: getParam(difficulty as string | string[]),
      sectionType: getParam(sectionType as string | string[]),
      page: page ? parseInt(getParam(page as string | string[])) : undefined,
      limit: limit ? parseInt(getParam(limit as string | string[])) : undefined,
      search: getParam(search as string | string[]),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/sectional/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mockService.getMockTests({
      type: 'sectional',
      sectionType: getParam(req.params.type).toUpperCase(),
      limit: 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mock = await mockService.getMockTestDetails(getParam(req.params.id));
    res.json({ success: true, data: mock });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await mockService.startMockTest(getParam(req.params.id), userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/attempt/:attemptId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await mockService.getAttemptProgress(getParam(req.params.attemptId), userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attempt/:attemptId/save', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { questionId, answer, timeSpent, status } = req.body;
    const attempt = await mockService.saveAnswer(
      getParam(req.params.attemptId),
      userId,
      questionId,
      answer,
      timeSpent,
      status
    );
    res.json({ success: true, data: { attemptId: attempt._id } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attempt/:attemptId/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { questionId } = req.body;
    const attempt = await mockService.markForReview(getParam(req.params.attemptId), userId, questionId);
    res.json({ success: true, data: { attemptId: attempt._id } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attempt/:attemptId/section', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { sectionIndex, action } = req.body;
    const result = await mockService.switchSection(getParam(req.params.attemptId), userId, sectionIndex, action);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attempt/:attemptId/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await mockService.submitMockTest(getParam(req.params.attemptId), userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/attempt/:attemptId/analysis', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const analysis = await mockService.getMockAnalysis(getParam(req.params.attemptId), userId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { page, limit } = req.query;
    const history = await mockService.getMockHistory(
      userId,
      page ? parseInt(getParam(page as string | string[])) : undefined,
      limit ? parseInt(getParam(limit as string | string[])) : undefined
    );
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MockAttempt, MockTest } = await import('./models/index.js');
    const { User } = await import('../user/model.js');

    const mock = await MockTest.findById(getParam(req.params.id));
    if (!mock) return res.status(404).json({ success: false, error: 'Mock not found' });

    const attempts = await MockAttempt.find({ mockTestId: req.params.id, status: 'completed' })
      .sort({ percentile: -1, totalScore: -1 })
      .limit(50)
      .populate('userId', 'name avatar')
      .lean();

    res.json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
});

export default router;