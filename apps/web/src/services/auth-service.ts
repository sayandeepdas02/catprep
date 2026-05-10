import { apiClient } from './api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { User, AuthTokens, ApiResponse } from '@techscholars/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (!response.data) throw new Error(response.error || 'Login failed');
    
    const { user, tokens } = response.data;
    useAuthStore.getState().login(user, tokens);
    return { user, tokens };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (!response.data) throw new Error(response.error || 'Registration failed');
    
    const { user, tokens } = response.data;
    useAuthStore.getState().login(user, tokens);
    return { user, tokens };
  },

  async googleAuth(): Promise<void> {
    const { FRONTEND_URL } = process.env;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async refreshToken(): Promise<void> {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.refreshToken) return;

    const response = await apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });

    if (response.data) {
      useAuthStore.getState().setTokens(response.data.tokens);
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    if (!response.data) throw new Error('Failed to get user');
    return response.data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', updates);
    if (!response.data) throw new Error('Failed to update profile');
    useAuthStore.getState().updateUser(response.data);
    return response.data;
  },
};