import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyGoal extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'daily' | 'weekly' | 'custom';
  title: string;
  description?: string;
  target: number;
  progress: number;
  unit: 'questions' | 'mocks' | 'time' | 'streak';
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

const studyGoalSchema = new Schema<IStudyGoal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['daily', 'weekly', 'custom'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  target: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  unit: { type: String, enum: ['questions', 'mocks', 'time', 'streak'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  recurrence: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

studyGoalSchema.index({ userId: 1, type: 1, isActive: 1 });
studyGoalSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const StudyGoal = mongoose.model<IStudyGoal>('StudyGoal', studyGoalSchema);

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'study' | 'mock' | 'battle' | 'revision';
  subject?: string;
  topicId?: mongoose.Types.ObjectId;
  duration: number;
  questionsAttempted: number;
  correctAnswers: number;
  startedAt: Date;
  endedAt?: Date;
  productivity: number;
  notes?: string;
}

const studySessionSchema = new Schema<IStudySession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['study', 'mock', 'battle', 'revision'], required: true },
  subject: { type: String },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  duration: { type: Number, required: true },
  questionsAttempted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  productivity: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

studySessionSchema.index({ userId: 1, startedAt: -1 });
studySessionSchema.index({ userId: 1, type: 1 });

export const StudySession = mongoose.model<IStudySession>('StudySession', studySessionSchema);

export interface IPomodoroSession extends Document {
  userId: mongoose.Types.ObjectId;
  focusDuration: number;
  breakDuration: number;
  sessionsCompleted: number;
  totalFocusTime: number;
  startedAt: Date;
  endedAt?: Date;
  type: 'focus' | 'break';
  isCompleted: boolean;
}

const pomodoroSessionSchema = new Schema<IPomodoroSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  focusDuration: { type: Number, default: 25 },
  breakDuration: { type: Number, default: 5 },
  sessionsCompleted: { type: Number, default: 0 },
  totalFocusTime: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  type: { type: String, enum: ['focus', 'break'], required: true },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

pomodoroSessionSchema.index({ userId: 1, startedAt: -1 });

export const PomodoroSession = mongoose.model<IPomodoroSession>('PomodoroSession', pomodoroSessionSchema);

export interface ITodo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  recurrence?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: Date };
  completedAt?: Date;
  tags: string[];
  order: number;
  isArchived: boolean;
}

const todoSchema = new Schema<ITodo>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date },
  recurrence: { frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] }, endDate: { type: Date } },
  completedAt: { type: Date },
  tags: [{ type: String }],
  order: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

todoSchema.index({ userId: 1, status: 1, isArchived: 1 });
todoSchema.index({ userId: 1, order: 1 });

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);

export interface ISearchQuery extends Document {
  userId?: mongoose.Types.ObjectId;
  query: string;
  results: { questions: number; topics: number; mocks: number; bookmarks: number };
  responseTime: number;
  timestamp: Date;
}

const searchQuerySchema = new Schema<ISearchQuery>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  query: { type: String, required: true },
  results: { questions: { type: Number, default: 0 }, topics: { type: Number, default: 0 }, mocks: { type: Number, default: 0 }, bookmarks: { type: Number, default: 0 } },
  responseTime: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

searchQuerySchema.index({ query: 'text' });
searchQuerySchema.index({ timestamp: -1 });

export const SearchQuery = mongoose.model<ISearchQuery>('SearchQuery', searchQuerySchema);

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  totalStudyTime: number;
  questionsSolved: number;
  mocksCompleted: number;
  battlesPlayed: number;
  battlesWon: number;
  xpEarned: number;
  goalProgress: number;
  pomodoroSessions: number;
  todosCompleted: number;
  subjects: Record<string, { time: number; questions: number; accuracy: number }>;
}

const userActivitySchema = new Schema<IUserActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  totalStudyTime: { type: Number, default: 0 },
  questionsSolved: { type: Number, default: 0 },
  mocksCompleted: { type: Number, default: 0 },
  battlesPlayed: { type: Number, default: 0 },
  battlesWon: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  goalProgress: { type: Number, default: 0 },
  pomodoroSessions: { type: Number, default: 0 },
  todosCompleted: { type: Number, default: 0 },
  subjects: { type: Map, of: { time: { type: Number, default: 0 }, questions: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } }, default: {} },
}, { timestamps: true });

userActivitySchema.index({ userId: 1, date: -1 }, { unique: true });

export const UserActivity = mongoose.model<IUserActivity>('UserActivity', userActivitySchema);

export interface ISystemLog extends Document {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, unknown>;
  userId?: mongoose.Types.ObjectId;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  timestamp: Date;
}

const systemLogSchema = new Schema<ISystemLog>({
  level: { type: String, enum: ['info', 'warn', 'error', 'debug'], required: true },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  ip: { type: String },
  userAgent: { type: String },
  endpoint: { type: String },
  method: { type: String },
  statusCode: { type: Number },
  duration: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });
systemLogSchema.index({ endpoint: 1, timestamp: -1 });

export const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);
