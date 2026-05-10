import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { User } from './model.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  targetPercentile: z.number().min(50).max(100).optional(),
  avatar: z.string().url().optional(),
});

router.put('/profile', authenticate, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      (req as any).user?.userId,
      { $set: req.body },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;