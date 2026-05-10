import { User } from '../user/model.js';
import { UserSettings } from '../settings/model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { createError } from '../../middleware/errorHandler.js';
import type { AuthTokens, User as UserType } from '@techscholars/types';
import type { LoginInput, RegisterInput } from './validator.js';

function sanitizeUser(user: any): UserType {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    targetPercentile: user.targetPercentile,
    streak: user.streak,
    xp: user.xp,
    provider: user.provider,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(data: LoginInput): Promise<{ user: UserType; tokens: AuthTokens }> {
  const user = await User.findOne({ email: data.email }).select('+password');
  
  if (!user || !user.password) {
    throw createError('Invalid credentials', 401);
  }

  const isValid = await user.comparePassword(data.password);
  if (!isValid) {
    throw createError('Invalid credentials', 401);
  }

  const tokens = await generateTokens(user);
  return { user: sanitizeUser(user), tokens };
}

export async function register(data: RegisterInput): Promise<{ user: UserType; tokens: AuthTokens }> {
  const existing = await User.findOne({ email: data.email });
  
  if (existing) {
    throw createError('Email already in use', 400);
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    provider: 'email',
  });

  await UserSettings.create({ userId: user._id });

  const tokens = await generateTokens(user);
  return { user: sanitizeUser(user), tokens };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);
  
  if (!user || user.refreshToken !== refreshToken) {
    throw createError('Invalid refresh token', 401);
  }

  return generateTokens(user);
}

export async function getCurrentUser(userId: string): Promise<UserType> {
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404);
  }
  return sanitizeUser(user);
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

async function generateTokens(user: any): Promise<AuthTokens> {
  const payload = { userId: user._id.toString(), email: user.email };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  await User.findByIdAndUpdate(user._id, { refreshToken });
  
  return { accessToken, refreshToken };
}