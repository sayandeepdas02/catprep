import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { getStudyStats, getAdvancedAnalytics, trackUserActivity, globalSearch, logInfo, logError } from './services/index.js';
import { generateAIRecommendations, getTopicRecommendations } from '../ai/recommendation-engine.js';
import { StudyGoal, StudySession, PomodoroSession, Todo } from './models/index.js';
import mongoose from 'mongoose';

const router = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const days = getParam(req.query.days as string | string[]);
    const stats = await getStudyStats(userId, days ? parseInt(days) : 30);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

router.get('/advanced', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const analytics = await getAdvancedAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (error) { next(error); }
});

router.post('/track', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const activity = await trackUserActivity(userId, req.body);
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
});

router.get('/ai/recommendations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const recommendations = await generateAIRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) { next(error); }
});

router.get('/ai/topic/:topicId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const topicId = getParam(req.params.topicId);
    const recommendations = await getTopicRecommendations(topicId, userId);
    res.json({ success: true, data: recommendations });
  } catch (error) { next(error); }
});

router.get('/goals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { type, active } = req.query;
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';
    const goals = await StudyGoal.find(query).sort({ startDate: -1 }).lean();
    res.json({ success: true, data: goals });
  } catch (error) { next(error); }
});

router.post('/goals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const goal = await StudyGoal.create({ ...req.body, userId: new mongoose.Types.ObjectId(userId) });
    res.json({ success: true, data: goal });
  } catch (error) { next(error); }
});

router.put('/goals/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const goal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: goal });
  } catch (error) { next(error); }
});

router.delete('/goals/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await StudyGoal.findOneAndDelete({ _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/todos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, archived } = req.query;
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) query.status = status;
    if (archived !== undefined) query.isArchived = archived === 'true';
    else query.isArchived = false;
    const todos = await Todo.find(query).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: todos });
  } catch (error) { next(error); }
});

router.post('/todos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const maxOrder = await Todo.findOne({ userId: new mongoose.Types.ObjectId(userId), isArchived: false })
      .sort({ order: -1 })
      .select('order')
      .lean();
    const todo = await Todo.create({
      ...req.body,
      userId: new mongoose.Types.ObjectId(userId),
      order: (maxOrder?.order || 0) + 1,
    });
    res.json({ success: true, data: todo });
  } catch (error) { next(error); }
});

router.put('/todos/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: todo });
  } catch (error) { next(error); }
});

router.patch('/todos/:id/move', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, order } = req.body;
    const updates: any = {};
    if (status) updates.status = status;
    if (order !== undefined) updates.order = order;
    if (status === 'completed') updates.completedAt = new Date();
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) },
      updates,
      { new: true }
    );
    res.json({ success: true, data: todo });
  } catch (error) { next(error); }
});

router.delete('/todos/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await Todo.findOneAndDelete({ _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/pomodoro/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessions = await PomodoroSession.find({
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: { $gte: weekAgo },
    }).lean();
    const totalFocusTime = sessions.reduce((sum: number, s: { totalFocusTime?: number }) => sum + (s.totalFocusTime || 0), 0);
    const totalSessions = sessions.filter((s: { isCompleted: boolean }) => s.isCompleted).length;
    res.json({ success: true, data: { totalFocusTime, totalSessions, sessions } });
  } catch (error) { next(error); }
});

router.post('/pomodoro/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { focusDuration, breakDuration } = req.body;
    const session = await PomodoroSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      focusDuration: focusDuration || 25,
      breakDuration: breakDuration || 5,
      type: 'focus',
      startedAt: new Date(),
    });
    res.json({ success: true, data: session });
  } catch (error) { next(error); }
});

router.post('/pomodoro/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { type, focusTime } = req.body;
    const session = await PomodoroSession.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(userId) },
      {
        $set: { type, isCompleted: type === 'break', endedAt: new Date() },
        $inc: {
          sessionsCompleted: type === 'focus' ? 1 : 0,
          totalFocusTime: type === 'focus' ? (focusTime || 25) : 0,
        },
      },
      { new: true }
    );
    res.json({ success: true, data: session });
  } catch (error) { next(error); }
});

router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { q } = req.body;
    if (!q) return res.json({ success: false, error: 'Query required' });
    const results = await globalSearch(q, userId);
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
});

router.get('/system/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, limit = 100 } = req.query;
    const query: any = {};
    if (level) query.level = level;
    const logs = await (await import('./models/index.js')).SystemLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .lean();
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
});

export default router;
