import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { BattleRoom, BattleInvite } from './models/index.js';
import mongoose from 'mongoose';

const router = Router();

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

router.post('/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode, topicId, questionCount } = req.body;
    const userId = (req as any).user?.userId;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const room = await BattleRoom.create({
      roomCode,
      mode: mode || '1v1',
      status: 'waiting',
      hostId: userId,
      topicId: topicId ? new mongoose.Types.ObjectId(topicId) : undefined,
      questionCount: questionCount || 10,
      timeLimit: 300,
    });

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

router.post('/join', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomCode } = req.body;
    const userId = (req as any).user?.userId;

    const room = await BattleRoom.findOne({ roomCode, status: { $in: ['waiting', 'ready'] } });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    if (room.opponentId && room.opponentId.toString() !== userId) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }

    room.opponentId = userId;
    room.status = 'ready';
    await room.save();

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

router.get('/:roomCode', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await BattleRoom.findOne({ roomCode: req.params.roomCode })
      .populate('hostId', 'name avatar')
      .populate('opponentId', 'name avatar')
      .lean();
    
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

router.post('/invite', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toUserId, mode, topicId } = req.body;
    const fromUserId = (req as any).user?.userId;

    const invite = await BattleInvite.create({
      fromUserId,
      toUserId,
      mode: mode || '1v1',
      topicId: topicId ? new mongoose.Types.ObjectId(topicId) : undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
});

router.get('/invites', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const invites = await BattleInvite.find({ toUserId: userId, status: 'pending' })
      .populate('fromUserId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: invites });
  } catch (error) {
    next(error);
  }
});

router.post('/invites/:id/respond', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accept } = req.body;
    const userId = (req as any).user?.userId;

    const invite = await BattleInvite.findById(req.params.id);
    if (!invite || invite.toUserId.toString() !== userId) {
      return res.status(404).json({ success: false, error: 'Invite not found' });
    }

    invite.status = accept ? 'accepted' : 'rejected';
    await invite.save();

    res.json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
});

router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { BattleResult } = await import('./models/index.js');

    const results = await BattleResult.find({
      'participants.userId': userId,
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export default router;