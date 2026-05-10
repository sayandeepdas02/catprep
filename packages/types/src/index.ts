export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  targetPercentile: number;
  streak: number;
  xp: number;
  provider: 'email' | 'google';
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  weeklyReport: boolean;
  targetStudyHours: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalProblemsSolved: number;
  accuracy: number;
  currentStreak: number;
  xp: number;
  rank: number;
  upcomingMocks: number;
  studyHoursThisWeek: number;
}

export interface Problem {
  id: string;
  title: string;
  category: 'quant' | 'lr' | 'di' | 'verbal';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  solved: boolean;
  createdAt: Date;
}

export interface MockTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: number;
  scheduledAt?: Date;
  completedAt?: Date;
  score?: number;
  percentile?: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  rank: number;
  streak: number;
}

export type QuestionType = 'MCQ' | 'MSQ' | 'TITA';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubjectSlug = 'quant' | 'lr' | 'di' | 'verbal';

export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestion {
  _id: string;
  type: QuestionType;
  subject: SubjectSlug;
  topicId: { _id: string; name: string; slug: string };
  subtopic?: string;
  difficulty: Difficulty;
  questionText: string;
  options: IQuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  tags: string[];
  estimatedTime: number;
  source?: string;
  year?: number;
  isPyq: boolean;
  isPremium: boolean;
}

export interface IPracticeSession {
  _id: string;
  userId: string;
  mode: 'topic' | 'timed' | 'accuracy' | 'pyq';
  status: 'in_progress' | 'completed' | 'abandoned';
  subjects?: string[];
  topicIds?: string[];
  difficulties?: string[];
  questionTypes?: string[];
  timeLimit?: number;
  questionCount?: number;
  isPyq?: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  totalTime: number;
  startedAt: string;
  completedAt?: string;
}

export interface IQuestionAttempt {
  _id: string;
  userId: string;
  questionId: string | IQuestion;
  type: QuestionType;
  subject: string;
  topicId: string;
  difficulty: string;
  selectedAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  timeTaken: number;
  isMarkedForReview: boolean;
  isSkipped: boolean;
  attemptedAt: string;
}

export interface ISubject {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface ITopic {
  _id: string;
  name: string;
  slug: string;
  subjectId: string;
  description?: string;
}

export interface IUserStats {
  totalQuestionsSolved: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalStudyTime: number;
  currentStreak: number;
  longestStreak: number;
  dailySolved: number;
  dailyGoal: number;
  totalXP: number;
  weeklySolved: number[];
  lastActiveDate: Date;
  subjectStats: Array<{
    subject: string;
    totalAttempted: number;
    correct: number;
    accuracy: number;
    avgTime: number;
  }>;
}

export interface IMockAttempt {
  _id: string;
  userId: string;
  mockTestId: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'submitted';
  totalScore: number;
  percentile: number;
  timeTaken: number;
  startedAt: string;
  completedAt?: string;
}

export interface IMockAnalysis {
  _id: string;
  userId: string;
  mockTestId: string;
  totalScore: number;
  maxScore: number;
  accuracy: number;
  percentile: number;
  sectionalAnalysis: Array<{
    sectionType: string;
    score: number;
    accuracy: number;
    correct: number;
    wrong: number;
  }>;
  improvementSuggestions: string[];
  strengths: string[];
  weakAreas: string[];
  comparedToLast: {
    scoreChange: number;
    accuracyChange: number;
    percentileChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export type BattleMode = '1v1' | 'topic_duel' | 'speed_challenge' | 'survival';
export type BattleStatus = 'waiting' | 'ready' | 'in_progress' | 'completed' | 'cancelled';

export interface IBattleRoom {
  _id: string;
  roomCode: string;
  mode: BattleMode;
  status: BattleStatus;
  hostId: string;
  opponentId?: string;
  questionCount: number;
  timeLimit: number;
}

export interface INotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  actionUrl?: string;
}

export interface IBadge {
  _id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface IRewardsStats {
  xp: number;
  streak: number;
  badges: IBadge[];
  achievements: Array<{
    _id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    currentStep: number;
    progress: number;
    completedAt?: string;
  }>;
}

export interface LeaderboardData {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  accuracy: number;
  totalSolved: number;
  weeklyXp: number;
  battlesWon?: number;
  battlesPlayed?: number;
  mockRank?: number;
  battleRank?: number;
}