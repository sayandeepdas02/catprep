import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { BattleRoom, BattleResult } from './models/index.js';
import { Question } from '../practice/models/index.js';
import mongoose from 'mongoose';

let io: SocketServer;

interface RoomState {
  roomCode: string;
  mode: string;
  players: Map<string, { odId: string; name: string; score: number; ready: boolean }>;
  currentQuestion: number;
  questionStartTime: number;
  isPaused: boolean;
}

const rooms = new Map<string, RoomState>();

export function setupSocketServer(httpServer: HTTPServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    console.log(`User ${userId} connected`);

    socket.on('create_room', async (data: { mode: string; topicId?: string; questionCount: number }) => {
      try {
        const roomCode = generateRoomCode();
        
        const room = await BattleRoom.create({
          roomCode,
          mode: data.mode || '1v1',
          status: 'waiting',
          hostId: new mongoose.Types.ObjectId(userId),
          questionCount: data.questionCount || 10,
          topicId: data.topicId ? new mongoose.Types.ObjectId(data.topicId) : undefined,
          timeLimit: 300,
        });

        rooms.set(roomCode, {
          roomCode,
          mode: data.mode || '1v1',
          players: new Map([[userId, { odId: socket.id, name: 'You', score: 0, ready: true }]]),
          currentQuestion: -1,
          questionStartTime: 0,
          isPaused: false,
        });

        socket.join(roomCode);
        (socket as any).roomCode = roomCode;

        socket.emit('room_created', { roomCode, room: room.toObject() });
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    socket.on('join_room', async (data: { roomCode: string }) => {
      try {
        const room = await BattleRoom.findOne({ roomCode: data.roomCode, status: 'waiting' });
        if (!room) {
          return socket.emit('error', { message: 'Room not found or already started' });
        }

        if (room.opponentId && room.opponentId.toString() !== userId) {
          return socket.emit('error', { message: 'Room is full' });
        }

        room.opponentId = new mongoose.Types.ObjectId(userId);
        room.status = 'ready';
        await room.save();

        const roomState = rooms.get(data.roomCode);
        if (roomState) {
          roomState.players.set(userId, { odId: socket.id, name: 'Opponent', score: 0, ready: true });
        }

        socket.join(data.roomCode);
        (socket as any).roomCode = data.roomCode;

        io.to(data.roomCode).emit('player_joined', { userId });
        io.to(room.hostId.toString()).emit('room_ready', { roomCode: data.roomCode });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('start_battle', async (data: { roomCode: string }) => {
      try {
        const room = await BattleRoom.findOne({ roomCode: data.roomCode });
        if (!room || room.hostId.toString() !== userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const questions = await Question.aggregate([
          { $match: { isActive: true } },
          { $sample: { size: room.questionCount } },
        ]);

        room.questions = questions.map(q => q._id);
        room.status = 'in_progress';
        room.startedAt = new Date();
        await room.save();

        const roomState = rooms.get(data.roomCode);
        if (roomState) {
          roomState.currentQuestion = 0;
          roomState.questionStartTime = Date.now();
          roomState.isPaused = false;
        }

        io.to(data.roomCode).emit('battle_started', {
          questions: questions.map(q => ({
            _id: q._id,
            type: q.type,
            questionText: q.questionText,
            options: q.options,
          })),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to start battle' });
      }
    });

    socket.on('submit_answer', async (data: { roomCode: string; questionIndex: number; answer: string | string[]; time: number }) => {
      try {
        const room = await BattleRoom.findOne({ roomCode: data.roomCode, status: 'in_progress' });
        if (!room) return;

        const isCorrect = Math.random() > 0.5;
        const points = isCorrect ? 10 : 0;

        const currentScores = room.scores as unknown as Map<string, number>;
        currentScores.set(userId, (currentScores.get(userId) || 0) + points);

        room.scores = currentScores;
        await room.save();

        io.to(data.roomCode).emit('answer_submitted', {
          userId,
          isCorrect,
          score: currentScores.get(userId),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    socket.on('next_question', async (data: { roomCode: string }) => {
      try {
        const room = await BattleRoom.findOne({ roomCode: data.roomCode, status: 'in_progress' });
        if (!room) return;

        const nextIndex = room.currentQuestionIndex + 1;
        
        if (nextIndex >= room.questionCount) {
          await endBattle(data.roomCode, room);
          return;
        }

        room.currentQuestionIndex = nextIndex;
        await room.save();

        const roomState = rooms.get(data.roomCode);
        if (roomState) {
          roomState.currentQuestion = nextIndex;
          roomState.questionStartTime = Date.now();
        }

        const question = await Question.findById(room.questions[nextIndex]);
        
        io.to(data.roomCode).emit('next_question', {
          questionIndex: nextIndex,
          question: {
            _id: question?._id,
            type: question?.type,
            questionText: question?.questionText,
            options: question?.options,
          },
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to load next question' });
      }
    });

    socket.on('leave_room', async (data: { roomCode: string }) => {
      await handleLeave(socket, data.roomCode, userId);
    });

    socket.on('disconnect', async () => {
      const roomCode = (socket as any).roomCode;
      if (roomCode) {
        await handleLeave(socket, roomCode, userId);
      }
    });
  });

  return io;
}

async function handleLeave(socket: Socket, roomCode: string, userId: string) {
  const room = await BattleRoom.findOne({ roomCode });
  if (!room) return;

  const roomState = rooms.get(roomCode);
  if (roomState) {
    roomState.players.delete(userId);
  }

  socket.leave(roomCode);
  (socket as any).roomCode = undefined;

  if (room.status === 'in_progress' || room.status === 'waiting') {
    room.status = 'cancelled';
    await room.save();
    if (io) io.to(roomCode).emit('player_left', { userId });
  }
}

async function endBattle(roomCode: string, room: any) {
  room.status = 'completed';
  room.completedAt = new Date();
  
  const scores = room.scores as unknown as Map<string, number>;
  const sortedPlayers = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  
  const winnerId = sortedPlayers[0]?.[0];
  room.winnerId = winnerId;
  await room.save();

  const xpAwarded = new Map<string, number>();
  for (let i = 0; i < sortedPlayers.length; i++) {
    const xp = Math.max(50 - i * 10, 10);
    xpAwarded.set(sortedPlayers[i][0], xp);
  }

  const duration = room.startedAt ? (Date.now() - new Date(room.startedAt).getTime()) / 1000 : 0;

  await BattleResult.create({
    roomId: room._id,
    mode: room.mode,
    participants: sortedPlayers.map(([userId, score], index) => ({
      userId,
      score,
      correct: score / 10,
      avgTime: duration / room.questionCount,
      rank: index + 1,
    })),
    winnerId,
    xpAwarded,
    completedAt: new Date(),
    duration,
  });

  if (io) {
    io.to(roomCode).emit('battle_ended', {
      winnerId,
      scores: Object.fromEntries(scores),
      xpAwarded: Object.fromEntries(xpAwarded),
    });
  }

  rooms.delete(roomCode);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}