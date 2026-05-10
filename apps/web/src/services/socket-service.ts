import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initializeSocket(): Socket {
  if (socket?.connected) return socket;

  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.accessToken) throw new Error('Not authenticated');

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
    auth: { token: tokens.accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('Socket connection error:', error);
  });

  return socket!;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export interface BattleRoom {
  roomCode: string;
  mode: string;
  hostId: string;
  hostName?: string;
  opponentId?: string;
  opponentName?: string;
  status: string;
  questionCount: number;
  timeLimit: number;
}

export interface BattleQuestion {
  _id: string;
  type: 'MCQ' | 'MSQ' | 'TITA';
  questionText: string;
  options: { id: string; text: string }[];
  topicId?: { name: string };
}

export interface BattleScore {
  [userId: string]: number;
}

type BattleEventCallback<T = any> = (data: T) => void;

const battleListeners: Map<string, Set<BattleEventCallback>> = new Map();

export const BattleSocket = {
  on(event: string, callback: BattleEventCallback) {
    if (!socket) return;
    socket.on(event, callback);

    if (!battleListeners.has(event)) {
      battleListeners.set(event, new Set());
    }
    battleListeners.get(event)!.add(callback);
  },

  off(event: string, callback: BattleEventCallback) {
    if (!socket) return;
    socket.off(event, callback);
    battleListeners.get(event)?.delete(callback);
  },

  emit(event: string, data: any) {
    if (!socket?.connected) {
      console.warn('Socket not connected');
      return;
    }
    socket.emit(event, data);
  },

  createRoom(data: { mode: string; topicId?: string; questionCount: number }) {
    this.emit('create_room', data);
  },

  joinRoom(roomCode: string) {
    this.emit('join_room', { roomCode });
  },

  startBattle(roomCode: string) {
    this.emit('start_battle', { roomCode });
  },

  submitAnswer(data: { roomCode: string; questionIndex: number; answer: string | string[]; time: number }) {
    this.emit('submit_answer', data);
  },

  nextQuestion(roomCode: string) {
    this.emit('next_question', { roomCode });
  },

  leaveRoom(roomCode: string) {
    this.emit('leave_room', { roomCode });
  },

  sendInvite(data: { toUserId: string; mode: string; topicId?: string }) {
    this.emit('send_invite', data);
  },

  acceptInvite(inviteId: string) {
    this.emit('accept_invite', { inviteId });
  },

  declineInvite(inviteId: string) {
    this.emit('decline_invite', { inviteId });
  },

  subscribeToRoom(roomCode: string) {
    this.emit('subscribe_room', { roomCode });
  },

  unsubscribeFromRoom(roomCode: string) {
    this.emit('unsubscribe_room', { roomCode });
  },

  joinUserRoom(userId: string) {
    if (!socket) return;
    socket.emit('join_user_room', { userId });
  },

  leaveUserRoom(userId: string) {
    if (!socket) return;
    socket.emit('leave_user_room', { userId });
  },
};

export function cleanupBattleListeners() {
  battleListeners.forEach((callbacks, event) => {
    callbacks.forEach((callback) => {
      socket?.off(event, callback);
    });
  });
  battleListeners.clear();
}