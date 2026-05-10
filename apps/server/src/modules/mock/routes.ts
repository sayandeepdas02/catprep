import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { MockTest, MockAttempt, MockAnalysis } from './models/index.js';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page = 1, limit = 10 } = _req.query;
    const query: Record<string, unknown> = { isActive: true };
    if (type) query.type = type;

    const [mocks, total] = await Promise.all([
      MockTest.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      MockTest.countDocuments(query),
    ]);

    res.json({ success: true, data: { mocks, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mock = await MockTest.findById(req.params.id).lean();
    if (!mock) return res.status(404).json({ success: false, error: 'Mock not found' });
    res.json({ success: true, data: mock });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const mockTestId = req.params.id;

    let attempt = await MockAttempt.findOne({ userId, mockTestId, status: 'in_progress' });
    if (attempt) {
      return res.json({ success: true, data: attempt });
    }

    attempt = await MockAttempt.create({
      userId,
      mockTestId,
      status: 'in_progress',
      currentSection: 0,
      startedAt: new Date(),
    });

    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const mockTestId = req.params.id;
    const { totalScore, answers } = req.body;

    const attempt = await MockAttempt.findOne({ userId, mockTestId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });

    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.totalScore = totalScore || 0;
    attempt.timeTaken = attempt.startedAt ? Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000) : 0;
    
    const totalAttempts = await MockAttempt.countDocuments({ mockTestId, status: 'completed' });
    const betterAttempts = await MockAttempt.countDocuments({ mockTestId, status: 'completed', totalScore: { $gt: attempt.totalScore } });
    attempt.percentile = totalAttempts > 0 ? ((totalAttempts - betterAttempts) / totalAttempts) * 100 : 0;

    await attempt.save();

    const answered = Object.values(answers as Record<string, unknown>).filter((a: any) => a).length;

    await MockAnalysis.create({
      userId,
      mockTestId,
      totalScore: attempt.totalScore,
      totalAttempted: answered,
      totalCorrect: Math.floor((attempt.totalScore || 0) / 3),
      totalWrong: answered - Math.floor((attempt.totalScore || 0) / 3),
      totalSkipped: 0,
      accuracy: answered > 0 ? (Math.floor((attempt.totalScore || 0) / 3) / answered) * 100 : 0,
      speed: 0,
      percentile: attempt.percentile,
      estimatedRank: totalAttempts - betterAttempts + 1,
      improvementSuggestions: ['Keep practicing sectional tests', 'Focus on time management'],
    });

    res.json({ success: true, data: { attempt, percentile: attempt.percentile } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/analysis', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const analysis = await MockAnalysis.findOne({ userId, mockTestId: req.params.id });
    if (!analysis) return res.status(404).json({ success: false, error: 'Analysis not found' });
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await MockAttempt.find({ mockTestId: req.params.id, status: 'completed' })
      .sort({ percentile: -1 })
      .limit(20)
      .populate('userId', 'name avatar')
      .lean();

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

export default router;