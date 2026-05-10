import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../modules/user/model.js';
import type { JWTPayload } from '@techscholars/types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userDoc?: any;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      
      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      (req as AuthRequest).user = payload;
      (req as AuthRequest).userDoc = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  })();
};