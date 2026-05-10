import { apiClient } from './api-client';
import type { ApiResponse } from '@techscholars/types';

interface MockTestFilters {
  type?: string;
  difficulty?: string;
  sectionType?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const mockService = {
  async getMocks(filters: MockTestFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return apiClient.get<ApiResponse<any>>(`/mocks?${params}`);
  },

  async getMockDetails(id: string) {
    return apiClient.get<ApiResponse<any>>(`/mocks/${id}`);
  },

  async getSectionalMocks(type: string) {
    return apiClient.get<ApiResponse<any>>(`/mocks/sectional/${type}`);
  },

  async startMock(id: string) {
    return apiClient.post<ApiResponse<any>>(`/mocks/${id}/start`);
  },

  async getAttempt(attemptId: string, mockId: string) {
    return apiClient.get<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}`);
  },

  async saveAnswer(mockId: string, attemptId: string, questionId: string, answer: string | string[], timeSpent: number, status: string) {
    return apiClient.post<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}/save`, {
      questionId, answer, timeSpent, status,
    });
  },

  async markForReview(mockId: string, attemptId: string, questionId: string) {
    return apiClient.post<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}/review`, { questionId });
  },

  async switchSection(mockId: string, attemptId: string, sectionIndex: number, action: 'move' | 'submit') {
    return apiClient.post<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}/section`, {
      sectionIndex, action,
    });
  },

  async submit(mockId: string, attemptId: string) {
    return apiClient.post<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}/submit`);
  },

  async getAnalysis(mockId: string, attemptId: string) {
    return apiClient.get<ApiResponse<any>>(`/mocks/${mockId}/attempt/${attemptId}/analysis`);
  },

  async getHistory(page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    return apiClient.get<ApiResponse<any>>(`/mocks/history?${params}`);
  },

  async getMockLeaderboard(mockId: string) {
    return apiClient.get<ApiResponse<any>>(`/mocks/${mockId}/leaderboard`);
  },
};