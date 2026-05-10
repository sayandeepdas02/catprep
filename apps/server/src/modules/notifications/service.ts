import { Notification, UserNotificationSettings } from './models/index.js';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(socketIO: SocketServer) {
  io = socketIO;
}

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  icon?: string;
  expiresAt?: Date;
}

export async function createNotification(params: CreateNotificationParams) {
  const settings = await UserNotificationSettings.findOne({ userId: params.userId });
  if (settings && params.type !== 'system') {
    const typeKey = params.type as keyof typeof settings.types;
    if (settings.types[typeKey] === false) return null;
  }

  const notification = await Notification.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data,
    priority: params.priority || 'normal',
    actionUrl: params.actionUrl,
    icon: params.icon,
    expiresAt: params.expiresAt,
  });

  if (io) {
    io.to(`user:${params.userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

export async function getNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const query: Record<string, unknown> = { userId };
  if (unreadOnly) query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
}

export async function markAllAsRead(userId: string) {
  return Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
}

export async function deleteNotification(userId: string, notificationId: string) {
  return Notification.findOneAndDelete({ _id: notificationId, userId });
}

export async function clearAllNotifications(userId: string): Promise<any> {
  return Notification.deleteMany({ userId });
}

export async function getUnreadCount(userId: string) {
  return Notification.countDocuments({ userId, isRead: false });
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    types: Record<string, boolean>;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>
) {
  return UserNotificationSettings.findOneAndUpdate(
    { userId },
    { $set: settings },
    { upsert: true, new: true }
  );
}

export async function getNotificationSettings(userId: string) {
  let settings = await UserNotificationSettings.findOne({ userId });
  if (!settings) {
    settings = await UserNotificationSettings.create({ userId });
  }
  return settings;
}

export async function sendBattleInvite(
  fromUserId: string,
  toUserId: string,
  roomCode: string,
  mode: string
) {
  return createNotification({
    userId: toUserId,
    type: 'battle_invite',
    title: 'Battle Invite',
    message: `You have a battle invite from a friend! Join room ${roomCode}`,
    priority: 'high',
    actionUrl: `/battle/${roomCode}`,
    data: { roomCode, mode, fromUserId },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
}

export async function sendStreakReminder(userId: string, currentStreak: number) {
  return createNotification({
    userId,
    type: 'streak_reminder',
    title: "Don't Break Your Streak!",
    message: `You're on a ${currentStreak}-day streak! Solve a question today to keep it going.`,
    priority: 'normal',
    actionUrl: '/practice',
  });
}

export async function sendLeaderboardUpdate(
  userId: string,
  newRank: number,
  previousRank: number
) {
  const change = previousRank - newRank;
  const direction = change > 0 ? 'improved' : change < 0 ? 'dropped' : 'maintained';

  return createNotification({
    userId,
    type: 'leaderboard_update',
    title: 'Leaderboard Update',
    message: `You ${direction}! Your new rank is #${newRank}`,
    priority: 'low',
    actionUrl: '/leaderboard',
  });
}