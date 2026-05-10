import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as leaderboardService from './service.js';

const router = Router();

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

router.get('/global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit, offset);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/friends', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await leaderboardService.getFriendsLeaderboard(userId, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/mock/:mockTestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mockTestId = getParamAsString(req.params.mockTestId);
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await leaderboardService.getMockLeaderboard(mockTestId, limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/battle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await leaderboardService.getBattleLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/top-performers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeRange = (req.query.timeRange as 'day' | 'week' | 'month') || 'week';
    const limit = parseInt(req.query.limit as string) || 10;
    const performers = await leaderboardService.getTopPerformers(timeRange, limit);
    res.json({ success: true, data: performers });
  } catch (error) {
    next(error);
  }
});

router.get('/rank/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getParamAsString(req.params.userId);
    const ranks = await leaderboardService.getUserRank(userId);
    res.json({ success: true, data: ranks });
  } catch (error) {
    next(error);
  }
});

export default router;