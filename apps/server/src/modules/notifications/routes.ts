import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as notificationService from './service.js';

const router = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(userId, {
      page: page ? parseInt(getParam(page as string | string[])) : undefined,
      limit: limit ? parseInt(getParam(limit as string | string[])) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const notification = await notificationService.markAsRead(userId, getParam(req.params.id));
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await notificationService.deleteNotification(userId, getParam(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await notificationService.clearAllNotifications(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const settings = await notificationService.getNotificationSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const settings = await notificationService.updateNotificationSettings(userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

export default router;