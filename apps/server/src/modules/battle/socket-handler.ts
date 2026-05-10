import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { BattleRoom, BattleResult } from './models/index.js';
import { Question } from '../practice/models/index.js';
import { User } from '../user/model.js';
import { awardXP } from '../rewards/service.js';
import { createNotification } from '../notifications/service.js';
import mongoose from 'mongoose';

let io: SocketServer;

interface PlayerState {
  odId: string;
  userId: string;
  name: string;
  score: number;
  correct: number;
  avgTime: number;
  answers: Map<number, { answer: string | string[]; isCorrect: boolean; time: number }>;
  ready: boolean;
  connected: boolean;
}

interface RoomState {
  roomCode: string;
  mode: string;
  hostId: string;
  players: Map<string, PlayerState>;
  questions: any[];
  currentQuestion: number;
  questionStartTime: number;
  timeLimit: number;
  topicId?: string;
  isPaused: boolean;
  endedAt?: number;
}

const rooms = new Map<string, RoomState>();
const userRooms = new Map<string, string>();

const BATTLE_MODES = {
  '1v1': { questions: 10, timePerQuestion: 30, xpMultiplier: 1 },
  'topic_duel': { questions: 5, timePerQuestion: 45, xpMultiplier: 1.5 },
  'speed_challenge': { questions: 20, timePerQuestion: 15, xpMultiplier: 2 },
  'survival': { questions: 50, timePerQuestion: 10, xpMultiplier: 3 },
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getAuthUser(socket: Socket): { userId: string; name: string } | null {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return { userId: decoded.userId, name: 'User' };
  } catch {
    return null;
  }
}

export function setupSocketServer(httpServer: HTTPServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    const user = getAuthUser(socket);
    if (!user) return next(new Error('Authentication required'));

    (socket as any).userId = user.userId;
    (socket as any).userName = user.name;

    try {
      const dbUser = await User.findById(user.userId).select('name avatar').lean();
      if (dbUser) (socket as any).userName = dbUser.name;
    } catch {}

    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const userName = (socket as any).userName;
    console.log(`User ${userId} connected`);

    socket.on('join_user_room', async ({ userId: targetUserId }) => {
      if (userId === targetUserId) {
        socket.join(`user:${targetUserId}`);
        userRooms.set(userId, `user:${targetUserId}`);
      }
    });

    socket.on('leave_user_room', () => {
      const room = userRooms.get(userId);
      if (room) {
        socket.leave(room);
        userRooms.delete(userId);
      }
    });

    socket.on('create_room', async (data: { mode: string; topicId?: string; questionCount?: number }) => {
      try {
        const mode = data.mode || '1v1';
        const config = BATTLE_MODES[mode as keyof typeof BATTLE_MODES] || BATTLE_MODES['1v1'];
        const roomCode = generateRoomCode();

        const room = await BattleRoom.create({
          roomCode,
          mode,
          status: 'waiting',
          hostId: new mongoose.Types.ObjectId(userId),
          questionCount: data.questionCount || config.questions,
          topicId: data.topicId ? new mongoose.Types.ObjectId(data.topicId) : undefined,
          timeLimit: config.timePerQuestion,
        });

        const roomState: RoomState = {
          roomCode,
          mode,
          hostId: userId,
          players: new Map([[userId, {
            odId: socket.id,
            userId,
            name: userName,
            score: 0,
            correct: 0,
            avgTime: 0,
            answers: new Map(),
            ready: true,
            connected: true,
          }]]),
          questions: [],
          currentQuestion: -1,
          questionStartTime: 0,
          timeLimit: config.timePerQuestion,
          topicId: data.topicId,
          isPaused: false,
        };

        rooms.set(roomCode, roomState);
        socket.join(roomCode);
        userRooms.set(userId, roomCode);
        (socket as any).roomCode = roomCode;

        socket.emit('room_created', {
          roomCode,
          mode,
          roomId: room._id,
          hostId: userId,
          hostName: userName,
          config,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room', code: 'ROOM_CREATE_FAILED' });
      }
    });

    socket.on('join_room', async (data: { roomCode: string }) => {
      try {
        const roomState = rooms.get(data.roomCode);
        if (!roomState) {
          const room = await BattleRoom.findOne({ roomCode: data.roomCode });
          if (!room) return socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
          if (room.status !== 'waiting') return socket.emit('error', { message: 'Battle already started', code: 'BATTLE_STARTED' });
          if (room.hostId.toString() === userId) return socket.emit('error', { message: 'You are the host', code: 'ALREADY_HOST' });
        }

        if (roomState) {
          if (roomState.players.size >= 2) {
            return socket.emit('error', { message: 'Room is full', code: 'ROOM_FULL' });
          }

          roomState.players.set(userId, {
            odId: socket.id,
            userId,
            name: userName,
            score: 0,
            correct: 0,
            avgTime: 0,
            answers: new Map(),
            ready: true,
            connected: true,
          });

          socket.join(data.roomCode);
          userRooms.set(userId, data.roomCode);
          (socket as any).roomCode = data.roomCode;

          await BattleRoom.findOneAndUpdate(
            { roomCode: data.roomCode },
            { opponentId: new mongoose.Types.ObjectId(userId), status: 'ready' }
          );

          io.to(data.roomCode).emit('player_joined', {
            userId,
            userName,
            players: Array.from(roomState.players.values()).map(p => ({
              userId: p.userId,
              name: p.name,
              score: p.score,
              ready: p.ready,
            })),
          });

          socket.emit('room_joined', {
            roomCode: data.roomCode,
            mode: roomState.mode,
            hostId: roomState.hostId,
            players: Array.from(roomState.players.values()).map(p => ({
              userId: p.userId,
              name: p.name,
              score: p.score,
            })),
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room', code: 'JOIN_FAILED' });
      }
    });

    socket.on('start_battle', async (data: { roomCode: string }) => {
      try {
        const roomState = rooms.get(data.roomCode);
        if (!roomState) return socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });

        if (roomState.hostId !== userId) {
          return socket.emit('error', { message: 'Only host can start', code: 'NOT_HOST' });
        }

        if (roomState.players.size < 2) {
          return socket.emit('error', { message: 'Need at least 2 players', code: 'NOT_ENOUGH_PLAYERS' });
        }

        const query: Record<string, unknown> = { isActive: true };
        if (roomState.topicId) {
          query.topicId = new mongoose.Types.ObjectId(roomState.topicId);
        }

        const questions = await Question.aggregate([
          { $match: query },
          { $sample: { size: roomState.players.size * (BATTLE_MODES[roomState.mode as keyof typeof BATTLE_MODES]?.questions || 10) } },
        ]);

        if (questions.length < 1) {
          return socket.emit('error', { message: 'Not enough questions available', code: 'NO_QUESTIONS' });
        }

        roomState.questions = questions;
        roomState.currentQuestion = 0;
        roomState.questionStartTime = Date.now();

        await BattleRoom.findOneAndUpdate(
          { roomCode: data.roomCode },
          { status: 'in_progress', questions: questions.map(q => q._id), startedAt: new Date() }
        );

        io.to(data.roomCode).emit('battle_started', {
          totalQuestions: questions.length,
          timeLimit: roomState.timeLimit,
          mode: roomState.mode,
          questions: questions.map((q, i) => ({
            index: i,
            type: q.type,
            questionText: q.questionText,
            options: q.options,
          })),
        });

        io.to(data.roomCode).emit('question_update', {
          questionIndex: 0,
          question: {
            _id: questions[0]._id,
            type: questions[0].type,
            questionText: questions[0].questionText,
            options: questions[0].options,
          },
          timeLimit: roomState.timeLimit,
          startTime: roomState.questionStartTime,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to start battle', code: 'START_FAILED' });
      }
    });

    socket.on('submit_answer', async (data: { roomCode: string; questionIndex: number; answer: string | string[]; time: number }) => {
      try {
        const roomState = rooms.get(data.roomCode);
        if (!roomState) return;
        if (data.questionIndex !== roomState.currentQuestion) return;

        const player = roomState.players.get(userId);
        if (!player) return;

        const question = roomState.questions[data.questionIndex];
        if (!question) return;

        const isCorrect = checkAnswer(question.correctAnswer, data.answer);
        const timeBonus = Math.max(0, roomState.timeLimit - data.time) * 0.5;
        const points = isCorrect ? 10 + Math.floor(timeBonus) : 0;

        player.score += points;
        player.correct += isCorrect ? 1 : 0;
        player.answers.set(data.questionIndex, { answer: data.answer, isCorrect, time: data.time });

        await BattleRoom.findOneAndUpdate(
          { roomCode: data.roomCode },
          { $inc: { [`scores.${userId}`]: points } }
        );

        io.to(data.roomCode).emit('score_update', {
          userId,
          score: player.score,
          correct: player.correct,
          isCorrect,
          points,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit answer', code: 'SUBMIT_FAILED' });
      }
    });

    socket.on('next_question', async (data: { roomCode: string }) => {
      try {
        const roomState = rooms.get(data.roomCode);
        if (!roomState) return;

        const nextIndex = roomState.currentQuestion + 1;

        if (nextIndex >= roomState.questions.length) {
          await endBattle(data.roomCode);
          return;
        }

        roomState.currentQuestion = nextIndex;
        roomState.questionStartTime = Date.now();

        const question = roomState.questions[nextIndex];

        await BattleRoom.findOneAndUpdate(
          { roomCode: data.roomCode },
          { currentQuestionIndex: nextIndex }
        );

        io.to(data.roomCode).emit('question_update', {
          questionIndex: nextIndex,
          question: {
            _id: question._id,
            type: question.type,
            questionText: question.questionText,
            options: question.options,
          },
          timeLimit: roomState.timeLimit,
          startTime: roomState.questionStartTime,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to load next question', code: 'NEXT_QUESTION_FAILED' });
      }
    });

    socket.on('question_timeout', async (data: { roomCode: string; questionIndex: number }) => {
      try {
        const roomState = rooms.get(data.roomCode);
        if (!roomState || roomState.currentQuestion !== data.questionIndex) return;

        io.to(data.roomCode).emit('question_expired', {
          questionIndex: data.questionIndex,
        });
      } catch (error) {
        console.error('Timeout handler error:', error);
      }
    });

    socket.on('send_invite', async (data: { toUserId: string; mode: string; topicId?: string }) => {
      try {
        const { BattleInvite } = await import('./models/index.js');

        const invite = await BattleInvite.create({
          fromUserId: new mongoose.Types.ObjectId(userId),
          toUserId: new mongoose.Types.ObjectId(data.toUserId),
          mode: data.mode,
          topicId: data.topicId ? new mongoose.Types.ObjectId(data.topicId) : undefined,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        const fromUser = await User.findById(userId).select('name avatar').lean();

        io.to(`user:${data.toUserId}`).emit('battle_invite', {
          inviteId: invite._id,
          fromUserId: userId,
          fromUserName: (fromUser as any)?.name || userName,
          mode: data.mode,
          expiresAt: invite.expiresAt,
        });

        socket.emit('invite_sent', { inviteId: invite._id });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send invite', code: 'INVITE_FAILED' });
      }
    });

    socket.on('accept_invite', async (data: { inviteId: string }) => {
      try {
        const { BattleInvite } = await import('./models/index.js');

        const invite = await BattleInvite.findById(data.inviteId);
        if (!invite || invite.toUserId.toString() !== userId || invite.status !== 'pending') {
          return socket.emit('error', { message: 'Invalid invite', code: 'INVALID_INVITE' });
        }

        invite.status = 'accepted';
        await invite.save();

        const existingRoom = await BattleRoom.findOne({
          $or: [
            { hostId: invite.fromUserId, opponentId: invite.toUserId },
            { hostId: invite.toUserId, opponentId: invite.fromUserId },
          ],
          status: { $in: ['waiting', 'ready'] },
        });

        if (existingRoom) {
          socket.emit('invite_accepted', { roomCode: existingRoom.roomCode });
          io.to(`user:${invite.fromUserId.toString()}`).emit('invite_accepted', { roomCode: existingRoom.roomCode });
        } else {
          const roomCode = generateRoomCode();
          const config = BATTLE_MODES[invite.mode as keyof typeof BATTLE_MODES] || BATTLE_MODES['1v1'];

          const room = await BattleRoom.create({
            roomCode,
            mode: invite.mode,
            status: 'waiting',
            hostId: invite.fromUserId,
            opponentId: invite.toUserId,
            topicId: invite.topicId,
            questionCount: config.questions,
            timeLimit: config.timePerQuestion,
          });

          socket.emit('invite_accepted', { roomCode, roomId: room._id });
          io.to(`user:${invite.fromUserId.toString()}`).emit('invite_accepted', { roomCode, roomId: room._id });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to accept invite', code: 'ACCEPT_FAILED' });
      }
    });

    socket.on('decline_invite', async (data: { inviteId: string }) => {
      try {
        const { BattleInvite } = await import('./models/index.js');

        await BattleInvite.findByIdAndUpdate(data.inviteId, { status: 'rejected' });
        socket.emit('invite_declined', { inviteId: data.inviteId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to decline invite', code: 'DECLINE_FAILED' });
      }
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('leave_room', async (data: { roomCode: string }) => {
      await handleLeave(socket, data.roomCode, userId);
    });

    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected`);
      const roomCode = userRooms.get(userId);
      if (roomCode && !roomCode.startsWith('user:')) {
        await handleLeave(socket, roomCode, userId);
      }
      userRooms.delete(userId);
    });
  });

  return io;
}

async function handleLeave(socket: Socket, roomCode: string, leaverUserId: string) {
  const roomState = rooms.get(roomCode);
  const userName = (socket as any).userName || 'Player';

  if (!roomState) {
    await BattleRoom.findOneAndUpdate({ roomCode }, { status: 'cancelled' });
    socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
    return;
  }

  const player = roomState.players.get(leaverUserId);
  if (player) {
    player.connected = false;
  }

  socket.leave(roomCode);
  userRooms.delete(leaverUserId);
  (socket as any).roomCode = undefined;

  if (roomState.currentQuestion >= 0 && roomState.currentQuestion < roomState.questions.length) {
    roomState.endedAt = Date.now();
    await endBattle(roomCode, leaverUserId);
    return;
  }

  if (roomState.players.size <= 1) {
    await BattleRoom.findOneAndUpdate({ roomCode }, { status: 'cancelled' });
    rooms.delete(roomCode);
  }

  io.to(roomCode).emit('player_left', { userId: leaverUserId, userName });
}

async function endBattle(roomCode: string, disconnectedUserId?: string) {
  const roomState = rooms.get(roomCode);
  if (!roomState) return;

  roomState.endedAt = roomState.endedAt || Date.now();

  const sortedPlayers = Array.from(roomState.players.values()).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  let winnerId = winner?.userId;
  if (disconnectedUserId && sortedPlayers.length > 1 && sortedPlayers[0].userId === disconnectedUserId) {
    winnerId = sortedPlayers[1].userId;
  }

  const duration = roomState.endedAt - (roomState.questions[0]?.createdAt?.getTime() || roomState.endedAt - 60000);

  const room = await BattleRoom.findOne({ roomCode });
  if (room) {
    room.status = 'completed';
    room.completedAt = new Date();
    room.winnerId = winnerId ? new mongoose.Types.ObjectId(winnerId) : undefined;
    await room.save();

    await BattleResult.create({
      roomId: room._id,
      mode: roomState.mode,
      participants: sortedPlayers.map(p => ({
        userId: new mongoose.Types.ObjectId(p.userId),
        score: p.score,
        correct: p.correct,
        avgTime: p.answers.size > 0
          ? Array.from(p.answers.values()).reduce((sum, a) => sum + a.time, 0) / p.answers.size
          : 0,
        rank: sortedPlayers.indexOf(p) + 1,
      })),
      winnerId: winnerId ? new mongoose.Types.ObjectId(winnerId) : undefined,
      xpAwarded: new Map(sortedPlayers.map((p, i) => [
        p.userId,
        Math.max(20, 50 - i * 10) * (BATTLE_MODES[roomState.mode as keyof typeof BATTLE_MODES]?.xpMultiplier || 1),
      ])),
      completedAt: new Date(),
      duration: Math.floor(duration / 1000),
    });

    const xpResults = sortedPlayers.map((p, i) => ({
      uid: p.userId as string,
      xp: Math.max(20, 50 - i * 10) * (BATTLE_MODES[roomState.mode as keyof typeof BATTLE_MODES]?.xpMultiplier || 1),
    }));

    for (const { uid, xp } of xpResults) {
      await awardXP(uid, xp, 'Battle victory', { battlesWon: winnerId === uid ? 1 : 0 });
    }
  }

  io.to(roomCode).emit('battle_ended', {
    roomCode,
    winnerId,
    mode: roomState.mode,
    players: sortedPlayers.map(p => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
      correct: p.correct,
      accuracy: p.answers.size > 0 ? (p.correct / p.answers.size) * 100 : 0,
    })),
    duration: Math.floor(duration / 1000),
    totalQuestions: roomState.questions.length,
  });

  for (const [userId] of roomState.players) {
    userRooms.delete(userId);
  }
  rooms.delete(roomCode);
}

function checkAnswer(correct: string | string[], selected: string | string[]): boolean {
  if (Array.isArray(correct) && Array.isArray(selected)) {
    return correct.length === selected.length && correct.every(c => selected.includes(c));
  }
  if (Array.isArray(correct)) return correct.includes(selected as string);
  if (Array.isArray(selected)) return selected.includes(correct);
  return correct === selected;
}

export function getIO(): SocketServer | null {
  return io;
}