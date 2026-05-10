import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { connectDB } from './database/connection.js';
import { initEnv } from '@techscholars/config';
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/user/routes.js';
import settingsRoutes from './modules/settings/routes.js';
import questionRoutes from './modules/practice/routes/question-routes.js';
import practiceRoutes from './modules/practice/routes/practice-routes.js';
import mockRoutes from './modules/mock/routes.js';
import battleRoutes from './modules/battle/routes.js';
import leaderboardRoutes from './modules/leaderboard/routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketServer } from './modules/battle/socket-handler.js';

const env = initEnv();

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many authentication attempts' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

setupSocketServer(httpServer);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await seedInitialData();

    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function seedInitialData() {
  const { Subject } = await import('./modules/practice/models/index.js');
  
  const subjects = [
    { name: 'Quantitative Ability', slug: 'quant', description: 'Mathematical and numerical problems', icon: 'calculator', color: '#3B82F6', order: 1 },
    { name: 'Logical Reasoning', slug: 'lr', description: 'Logical deduction and arrangement problems', icon: 'brain', color: '#8B5CF6', order: 2 },
    { name: 'Data Interpretation', slug: 'di', description: 'Data analysis and interpretation', icon: 'chart', color: '#10B981', order: 3 },
    { name: 'Verbal Ability', slug: 'verbal', description: 'Reading comprehension and vocabulary', icon: 'book', color: '#F59E0B', order: 4 },
  ];

  for (const subject of subjects) {
    await Subject.findOneAndUpdate({ slug: subject.slug }, subject, { upsert: true });
  }
  console.log('Seeded initial data');
}

start();