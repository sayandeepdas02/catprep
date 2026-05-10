import { apiClient } from './api-client';
import type { IQuestion, IPracticeSession, IQuestionAttempt, ISubject, ITopic, IUserStats } from '@techscholars/types';

interface QuestionFilters {
  subject?: string;
  topicIds?: string[];
  difficulties?: string[];
  types?: string[];
  isPyq?: boolean;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface StartSessionData {
  mode: 'topic' | 'timed' | 'accuracy' | 'pyq';
  subjects?: string[];
  topicIds?: string[];
  difficulties?: string[];
  questionTypes?: string[];
  timeLimit?: number;
  questionCount?: number;
  isPyq?: boolean;
}

export const practiceService = {
  async getQuestions(filters: QuestionFilters) {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.topicIds?.length) params.append('topicIds', filters.topicIds.join(','));
    if (filters.difficulties?.length) params.append('difficulties', filters.difficulties.join(','));
    if (filters.types?.length) params.append('types', filters.types.join(','));
    if (filters.isPyq) params.append('isPyq', 'true');
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    return apiClient.get<{ data: { questions: IQuestion[]; total: number; hasMore: boolean } }>(
      `/questions?${params}`
    );
  },

  async getRandomQuestions(filters: { subject?: string; topicIds?: string[]; difficulties?: string[]; types?: string[]; isPyq?: boolean; count?: number }) {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.topicIds?.length) params.append('topicIds', filters.topicIds.join(','));
    if (filters.difficulties?.length) params.append('difficulties', filters.difficulties.join(','));
    if (filters.types?.length) params.append('types', filters.types.join(','));
    if (filters.isPyq) params.append('isPyq', 'true');
    if (filters.count) params.append('count', filters.count.toString());
    
    return apiClient.get<{ data: IQuestion[] }>(`/questions/random?${params}`);
  },

  async getSubjects() {
    return apiClient.get<{ data: ISubject[] }>('/questions/subjects');
  },

  async getTopics(subjectSlug: string) {
    return apiClient.get<{ data: ITopic[] }>(`/questions/subjects/${subjectSlug}/topics`);
  },

  async startSession(data: StartSessionData) {
    return apiClient.post<{ data: IPracticeSession }>('/practice/session/start', data);
  },

  async submitAnswer(data: { sessionId: string; questionId: string; selectedAnswer: string | string[]; timeTaken: number; isMarkedForReview?: boolean; isSkipped?: boolean }) {
    return apiClient.post<{ data: IQuestionAttempt }>('/practice/session/submit', data);
  },

  async completeSession(sessionId: string) {
    return apiClient.post<{ data: { stats: { total: number; answered: number; correct: number; accuracy: number; totalTime: number } } }>(`/practice/session/${sessionId}/complete`);
  },

  async getSession(sessionId: string) {
    return apiClient.get<{ data: IPracticeSession }>(`/practice/session/${sessionId}`);
  },

  async getSessionQuestions(sessionId: string) {
    return apiClient.get<{ data: IQuestionAttempt[] }>(`/practice/session/${sessionId}/questions`);
  },

  async getSessions(page = 1, limit = 10) {
    return apiClient.get<{ data: { sessions: IPracticeSession[]; total: number; hasMore: boolean } }>(`/practice/sessions?page=${page}&limit=${limit}`);
  },

  async addBookmark(questionId: string, notes?: string, tags?: string[]) {
    return apiClient.post<{ data: unknown }>('/practice/bookmarks', { questionId, notes, tags });
  },

  async removeBookmark(questionId: string) {
    return apiClient.delete(`/practice/bookmarks/${questionId}`);
  },

  async getBookmarks(page = 1, limit = 20) {
    return apiClient.get<{ data: { bookmarks: Array<{ _id: string; questionId: IQuestion; notes?: string; tags?: string[] }>; total: number; hasMore: boolean } }>(`/practice/bookmarks?page=${page}&limit=${limit}`);
  },

  async isBookmarked(questionId: string) {
    return apiClient.get<{ data: { isBookmarked: boolean } }>(`/practice/bookmarks/${questionId}/check`);
  },

  async saveNotes(questionId: string, content: string, approach?: string, formula?: string) {
    return apiClient.post<{ data: unknown }>('/practice/notes', { questionId, content, approach, formula });
  },

  async getNotes(questionId: string) {
    return apiClient.get<{ data: { content: string; approach?: string; formula?: string } | null }>(`/practice/notes/${questionId}`);
  },

  async getUserNotes(page = 1, limit = 20) {
    return apiClient.get<{ data: { notes: Array<{ _id: string; questionId: IQuestion; content: string; approach?: string; formula?: string }>; total: number; hasMore: boolean } }>(`/practice/notes?page=${page}&limit=${limit}`);
  },

  async getAnalytics() {
    return apiClient.get<{ data: { overall: IUserStats; recentSessions: IPracticeSession[]; weakTopics: unknown[]; strongTopics: unknown[]; subjectStats: Array<{ subject: string; totalAttempted: number; correct: number; accuracy: number }> } }>('/practice/analytics');
  },
};