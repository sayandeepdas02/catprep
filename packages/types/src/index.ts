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
  subjectStats: Array<{
    subject: string;
    totalAttempted: number;
    correct: number;
    accuracy: number;
    avgTime: number;
  }>;
}