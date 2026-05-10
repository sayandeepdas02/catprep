import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as rewardsService from './service.js';

const router = Router();

router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const rewards = await rewardsService.getUserRewards(userId);
    res.json({ success: true, data: rewards });
  } catch (error) {
    next(error);
  }
});

router.get('/milestones', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const milestones = await rewardsService.getMilestones();
    res.json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
});

router.get('/streak-rewards', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rewards = await rewardsService.getLeaderboardRewards();
    res.json({ success: true, data: rewards });
  } catch (error) {
    next(error);
  }
});

router.post('/update-streak', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await rewardsService.updateStreak(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;