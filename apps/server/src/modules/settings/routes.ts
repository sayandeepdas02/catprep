import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserSettings } from './model.js';

const router = Router();

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  dailyReminder: z.boolean().optional(),
  reminderTime: z.string().optional(),
  weeklyReport: z.boolean().optional(),
  targetStudyHours: z.number().min(1).max(16).optional(),
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await UserSettings.findOne({ userId: (req as any).user?.userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId: (req as any).user?.userId });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, validate(updateSettingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId: (req as any).user?.userId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

export default router;