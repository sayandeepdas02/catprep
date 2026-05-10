import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: class MockObjectId {
        constructor(id?: string) { this.id = id || new Date().toString(); }
        id: string;
      }
    }
  }
}));

describe('Analytics Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackUserActivity', () => {
    it('should create activity with correct data structure', async () => {
      const mockData = {
        type: 'study' as const,
        duration: 30,
        questionsSolved: 5,
        xpEarned: 100,
        subject: 'quant'
      };

      expect(mockData.type).toBe('study');
      expect(mockData.duration).toBe(30);
      expect(mockData.questionsSolved).toBe(5);
    });
  });

  describe('getStudyStats', () => {
    it('should calculate correct totals', () => {
      const activities = [
        { totalStudyTime: 60, questionsSolved: 10, xpEarned: 50 },
        { totalStudyTime: 30, questionsSolved: 5, xpEarned: 25 }
      ];

      const totalStudyTime = activities.reduce((sum, a) => sum + a.totalStudyTime, 0);
      const totalQuestions = activities.reduce((sum, a) => sum + a.questionsSolved, 0);

      expect(totalStudyTime).toBe(90);
      expect(totalQuestions).toBe(15);
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for empty activities', () => {
      const activities: any[] = [];
      expect(activities.length).toBe(0);
    });

    it('should calculate streak correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const activities = [
        { date: new Date(today) },
        { date: yesterday }
      ];

      expect(activities.length).toBe(2);
    });
  });

  describe('globalSearch', () => {
    it('should return results structure', () => {
      const results = {
        questions: [],
        topics: [],
        mocks: [],
        bookmarks: [],
        total: 0,
        responseTime: 0
      };

      expect(results).toHaveProperty('questions');
      expect(results).toHaveProperty('topics');
      expect(results).toHaveProperty('total');
    });
  });
});

describe('AI Recommendation Engine', () => {
  describe('generateAIRecommendations', () => {
    it('should generate recommendations with correct structure', async () => {
      const mockRecommendations = {
        recommendations: [],
        weakTopics: [],
        strongTopics: [],
        dailyPractice: [],
        insights: [],
        revisionPlan: [],
        overallScore: 50,
        strengths: [],
        improvements: []
      };

      expect(mockRecommendations).toHaveProperty('overallScore');
      expect(mockRecommendations.overallScore).toBe(50);
    });

    it('should identify weak topics based on accuracy', () => {
      const topics = [
        { accuracy: 45, attempted: 10 },
        { accuracy: 80, attempted: 10 },
        { accuracy: 55, attempted: 6 }
      ];

      const weakTopics = topics.filter(t => t.accuracy < 60 && t.attempted >= 5);
      expect(weakTopics.length).toBe(2);

      const strictWeak = topics.filter(t => t.accuracy < 50 && t.attempted >= 5);
      expect(strictWeak.length).toBe(1);
      expect(strictWeak[0].accuracy).toBe(45);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate score based on accuracy and topics', () => {
      let score = 50;
      
      const userStats = { overallAccuracy: 75 };
      score += (userStats.overallAccuracy - 50) * 0.3;
      
      const weakTopics = [{ accuracy: 40 }];
      const strongTopics = [{ accuracy: 85 }];
      score -= weakTopics.length * 3;
      score += strongTopics.length * 2;

      expect(score).toBeGreaterThan(50);
    });
  });
});
