# TechScholars API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://api.techscholars.com
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Routes (`/api/auth`)

### POST /register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /refresh
Refresh access token.

### POST /google
Google OAuth authentication.

### GET /logout
Logout user.

---

## User Routes (`/api/users`)

### GET /profile
Get current user profile.

### PUT /profile
Update user profile.

### PUT /password
Change password.

### POST /streak
Update daily streak.

---

## Practice Routes (`/api/practice`)

### POST /session/start
Start a new practice session.

**Request Body:**
```json
{
  "mode": "topic",
  "subjects": ["quant", "lr"],
  "topicIds": ["topic_id_1", "topic_id_2"],
  "difficulties": ["easy", "medium"],
  "questionCount": 10,
  "timeLimit": 120
}
```

### POST /session/submit
Submit answer for a question.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "questionId": "question_id",
  "selectedAnswer": "A",
  "timeTaken": 45,
  "isMarkedForReview": false
}
```

### POST /session/:id/complete
Complete a practice session.

### GET /session/:id
Get session details.

### GET /sessions
Get user's practice sessions (paginated).

### GET /bookmarks
Get user's bookmarked questions.

### POST /bookmarks
Add a bookmark.

**Request Body:**
```json
{
  "questionId": "question_id",
  "notes": "Important question",
  "tags": ["algebra", "important"]
}
```

### DELETE /bookmarks/:questionId
Remove a bookmark.

### GET /notes
Get user's notes.

### POST /notes
Create or update notes.

**Request Body:**
```json
{
  "questionId": "question_id",
  "content": "Solution approach...",
  "approach": "Use substitution method",
  "formula": "x = (a + b) / 2"
}
```

---

## Question Routes (`/api/questions`)

### GET /
Get questions with filters.

**Query Parameters:**
- `subject` - Filter by subject
- `topicIds` - Filter by topics (comma-separated)
- `difficulties` - Filter by difficulty
- `types` - Filter by question type
- `page` - Page number
- `limit` - Results per page

### GET /:id
Get single question with options.

### GET /subjects
Get all subjects.

### GET /subjects/:slug/topics
Get topics for a subject.

---

## Mock Routes (`/api/mocks`)

### GET /
Get available mock tests.

**Query Parameters:**
- `type` - Sectional/Full length
- `difficulty` - easy/medium/hard
- `page` - Page number

### GET /:id
Get mock test details.

### POST /:id/start
Start a mock test attempt.

### PUT /:id/answer
Submit answer for mock question.

**Request Body:**
```json
{
  "attemptId": "attempt_id",
  "sectionIndex": 0,
  "questionIndex": 0,
  "answer": "A",
  "status": "answered"
}
```

### POST /:id/submit
Submit completed mock test.

### GET /:id/result/:attemptId
Get mock test result.

---

## Battle Routes (`/api/battles`)

### POST /create
Create a new battle room.

**Request Body:**
```json
{
  "mode": "1v1",
  "questionCount": 10,
  "timeLimit": 300
}
```

### POST /join
Join an existing battle.

**Request Body:**
```json
{
  "roomCode": "ABC123"
}
```

### GET /active
Get user's active battles.

---

## Analytics Routes (`/api/analytics`)

### GET /stats
Get study statistics.

**Query Parameters:**
- `days` - Number of days (default: 30)

### GET /advanced
Get advanced analytics.

### POST /track
Track user activity.

**Request Body:**
```json
{
  "type": "study",
  "duration": 30,
  "questionsSolved": 5,
  "xpEarned": 100
}
```

### GET /ai/recommendations
Get AI-powered recommendations.

### GET /goals
Get study goals.

### POST /goals
Create a new goal.

**Request Body:**
```json
{
  "type": "daily",
  "title": "Solve 20 questions",
  "target": 20,
  "unit": "questions",
  "startDate": "2024-01-15"
}
```

### GET /todos
Get user's todo list.

### POST /todos
Create a new todo.

**Request Body:**
```json
{
  "title": "Complete DI chapter",
  "status": "todo",
  "priority": "high",
  "dueDate": "2024-01-20",
  "tags": ["practice", "di"]
}
```

### PATCH /todos/:id/move
Move/update todo position.

**Request Body:**
```json
{
  "status": "completed",
  "order": 5
}
```

### GET /pomodoro/stats
Get Pomodoro session stats.

### POST /pomodoro/start
Start a Pomodoro session.

### POST /pomodoro/:id/complete
Complete a Pomodoro session.

---

## Leaderboard Routes (`/api/leaderboard`)

### GET /
Get overall leaderboard.

**Query Parameters:**
- `limit` - Number of results (default: 50)
- `offset` - Offset for pagination

### GET /weekly
Get weekly leaderboard.

---

## Notifications Routes (`/api/notifications`)

### GET /
Get user notifications.

### PUT /:id/read
Mark notification as read.

### PUT /read-all
Mark all notifications as read.

### DELETE /:id
Delete a notification.

---

## Rewards Routes (`/api/rewards`)

### GET /stats
Get user rewards and achievements.

### GET /badges
Get all available badges.

---

## Health Check

### GET /api/health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes:
- `UNAUTHORIZED` (401) - Invalid or missing token
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 20 requests per 15 minutes

---

## WebSocket Events

### Battle Events
- `battle:join` - Join a battle room
- `battle:leave` - Leave a battle room
- `battle:start` - Battle started
- `battle:question` - New question broadcast
- `battle:answer` - Answer submitted
- `battle:end` - Battle completed

### Notification Events
- `notification:new` - New notification received
