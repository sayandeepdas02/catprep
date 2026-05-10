# TechScholars - CAT Preparation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-47B248?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Socket.io-000000?style=for-the-badge&logo=socket.io" alt="Socket.io">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/last-commit/sayandeepdas02/catprep?style=for-the-badge&logo=git" alt="Last Commit">
  <img src="https://img.shields.io/github/contributors/sayandeepdas02/catprep?style=for-the-badge&logo=github" alt="Contributors">
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

TechScholars is a production-grade CAT preparation platform focused on problem solving, mock tests, competitive analytics, and productivity tooling for CAT aspirants. Built with enterprise-level architecture, clean folder structure, and modular backend.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Refresh Tokens
- **Real-time**: Socket.IO
- **Validation**: Zod

### DevOps
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm workspaces

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication with access/refresh tokens
- Google OAuth integration
- Secure password hashing with bcrypt
- Protected routes and session management

### 📚 Practice Engine
- MCQ, MSQ, and TITA question types
- Subject-wise (Quantitative, LR, DI, Verbal) practice
- Topic-wise difficulty filters
- Timed practice sessions
- Question bookmarking and notes

### 📝 Mock Tests
- Full-length CAT mocks
- Sectional mocks (VARC, LRDI, QA)
- Section timer locking
- Real percentile estimation
- Detailed analytics and analysis

### ⚔️ Battlefield (Real-time)
- 1v1 battles with Socket.IO
- Live question solving
- Real-time score sync
- XP and rewards system

### 🏆 Leaderboards
- Global rankings
- Weekly rankings
- Mock test rankings
- Battle mode rankings

### 📊 Analytics
- Accuracy tracking
- Weak/strong topic analysis
- Streak tracking
- Speed vs accuracy charts

### ⚙️ Settings
- Profile management
- Theme customization (dark/light)
- Notification preferences
- Study goals

---

## 📂 Project Structure

```
techscholars/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # API services
│   │   │   ├── stores/          # Zustand stores
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── lib/             # Utilities
│   │   │   └── providers/       # React providers
│   │   ├── public/             # Static assets
│   │   └── package.json
│   │
│   └── server/                 # Express.js backend
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/        # Authentication
│       │   │   ├── practice/    # Practice engine
│       │   │   ├── mock/        # Mock tests
│       │   │   ├── battle/      # Real-time battles
│       │   │   ├── leaderboard/# Rankings
│       │   │   ├── user/        # User management
│       │   │   └── settings/    # User settings
│       │   ├── middleware/      # Express middleware
│       │   ├── database/        # MongoDB connection
│       │   ├── utils/          # Utilities
│       │   └── index.ts         # Server entry
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Environment config
│
├── docker-compose.yml          # Docker orchestration
├── package.json                # Root workspace
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sayandeepdas02/catprep.git
cd catprep

# Install dependencies
npm install

# Build shared packages
npm run build -w @techscholars/types
npm run build -w @techscholars/config
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:web    # Frontend: http://localhost:3000
npm run dev:server # Backend: http://localhost:3001
```

### Production Build

```bash
npm run build
```

---

## 🔑 Environment Variables

Create `.env` files based on the examples:

### Server (`apps/server/.env`)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/techscholars
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
FRONTEND_URL=http://localhost:3000
```

### Web (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - List questions with filters
- `GET /api/questions/random` - Get random questions
- `GET /api/questions/subjects` - List subjects
- `GET /api/questions/subjects/:slug/topics` - List topics

### Practice
- `POST /api/practice/session/start` - Start practice session
- `POST /api/practice/session/submit` - Submit answer
- `POST /api/practice/session/:id/complete` - Complete session
- `GET /api/practice/analytics` - Get user analytics

### Mocks
- `GET /api/mocks` - List mock tests
- `POST /api/mocks/:id/start` - Start mock test
- `POST /api/mocks/:id/complete` - Submit mock
- `GET /api/mocks/:id/analysis` - Get analysis

### Battles
- `POST /api/battles/create` - Create battle room
- `POST /api/battles/join` - Join battle room
- `GET /api/battles/history` - Get battle history

### Leaderboard
- `GET /api/leaderboard/global` - Global rankings
- `GET /api/leaderboard/weekly` - Weekly rankings
- `GET /api/leaderboard/battle` - Battle rankings

---

## 🐳 Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### Manual Deployment

```bash
# Build server
cd apps/server
npm run build
npm start

# Build frontend
cd apps/web
npm run build
npm start
```

### Deployment Platforms

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sayandeep Das**
- GitHub: [@sayandeepdas02](https://github.com/sayandeepdas02)

---

## ⭐ Show your support

Give a ⭐️ if this project helped you!

<p align="center">Made with ❤️ for CAT Aspirants</p>