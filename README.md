# TechScholars - CAT Preparation Platform

A production-ready full-stack application for CAT (Common Admission Test) preparation featuring AI-powered recommendations, advanced analytics, study planning, and competitive gamification.

![TechScholars](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-ISC-green)
![Node](https://img.shields.io/badge/Node-18%2B-green)

## Features

### Core Practice
- **Topic-wise Practice**: Questions organized by subjects and topics
- **Timed Practice**: Timed sessions for exam simulation
- **Accuracy Mode**: Focus on improving accuracy
- **Previous Year Questions (PYQ)**: Practice with past exam questions

### Mock Tests
- **Sectional Tests**: Subject-specific mock tests
- **Full Length Tests**: Complete CAT simulation
- **Adaptive Difficulty**: Questions adjust based on performance

### Analytics & Insights
- **Performance Dashboard**: Track progress with charts and graphs
- **AI Recommendations**: Personalized study suggestions
- **Heatmap Visualization**: Activity tracking
- **Subject Breakdown**: Detailed accuracy analysis

### Gamification
- **Battle Mode**: 1v1 real-time competitions
- **Leaderboards**: Weekly and all-time rankings
- **XP System**: Earn experience points
- **Streaks**: Daily study streak tracking
- **Achievements**: Unlock badges and rewards

### Productivity Tools
- **Pomodoro Timer**: Focus sessions with breaks
- **Study Planner**: Goal setting and tracking
- **Kanban Tasks**: Organize study tasks
- **Notes**: Save approaches and formulas
- **Bookmarks**: Save important questions

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Recharts** - Data visualization

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Winston** - Logging

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ts

# Install dependencies
npm install

# Create environment files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Edit environment files with your values

# Start development servers
npm run dev
```

### Environment Variables

**Server (apps/server/.env)**:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/techscholars
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
FRONTEND_URL=http://localhost:3000
```

**Web (apps/web/.env)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available Scripts

```bash
# Development
npm run dev          # Start both servers
npm run dev:web      # Start frontend only
npm run dev:server   # Start backend only

# Build
npm run build        # Build both apps
npm run build:web    # Build frontend
npm run build:server # Build backend

# Testing
npm run typecheck    # Type check all apps
npm test             # Run unit tests (server)

# Linting
npm run lint         # Lint all apps
```

## Project Structure

```
ts/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── dashboard/ # Dashboard pages
│   │   │   │   ├── auth/      # Auth pages
│   │   │   │   └── (marketing)/ # Landing page
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities & hooks
│   │   │   ├── services/      # API client
│   │   │   └── stores/        # Zustand stores
│   │   └── public/            # Static assets
│   │
│   └── server/                # Express backend
│       └── src/
│           ├── modules/        # Feature modules
│           │   ├── auth/      # Authentication
│           │   ├── practice/  # Practice routes
│           │   ├── mock/      # Mock tests
│           │   ├── battle/    # Battle mode
│           │   ├── analytics/ # Analytics & AI
│           │   └── ...
│           ├── middleware/     # Express middleware
│           ├── utils/         # Utilities
│           └── docs/          # API documentation
│
├── packages/
│   ├── config/                # Shared config
│   └── types/                 # Shared TypeScript types
│
├── DEPLOYMENT.md              # Deployment guide
└── package.json               # Workspace config
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Practice
- `POST /api/practice/session/start` - Start session
- `POST /api/practice/session/submit` - Submit answer
- `GET /api/practice/bookmarks` - Get bookmarks
- `GET /api/practice/notes` - Get notes

### Mock Tests
- `GET /api/mocks` - List mocks
- `POST /api/mocks/:id/start` - Start mock
- `POST /api/mocks/:id/submit` - Submit mock

### Analytics
- `GET /api/analytics/stats` - Get stats
- `GET /api/analytics/ai/recommendations` - AI recommendations
- `GET /api/analytics/goals` - Study goals

### Battles
- `POST /api/battles/create` - Create battle
- `POST /api/battles/join` - Join battle

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Main dashboard |
| `/dashboard/analytics` | Analytics dashboard |
| `/dashboard/planner` | Study planner |
| `/dashboard/pomodoro` | Pomodoro timer |
| `/dashboard/tasks` | Kanban board |
| `/dashboard/notes` | Notes |
| `/dashboard/bookmarks` | Bookmarks |
| `/dashboard/admin` | Admin panel |
| `/auth/login` | Login page |
| `/auth/register` | Register page |

## Development

### Adding New Features

1. Create route handlers in appropriate module
2. Add service functions for business logic
3. Create React components in frontend
4. Add TypeScript interfaces
5. Write unit tests

### Code Style

- Use TypeScript for type safety
- Follow existing patterns
- Add JSDoc comments for complex functions
- Write unit tests for new features

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run typecheck
npm run typecheck
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy (Vercel + Railway)

1. Frontend: `vercel deploy apps/web`
2. Backend: Connect Railway to `apps/server`

## License

ISC

## Author

Built with ❤️ for CAT aspirants
