import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema, refreshTokenSchema } from './validator.js';
import * as authService from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: { tokens } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser((req as any).user?.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout((req as any).user?.userId);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;