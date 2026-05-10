# TechScholars Deployment Guide

## Prerequisites

- Node.js 18+ 
- MongoDB 6+ (local or Atlas)
- npm or yarn

---

## Local Development

```bash
# Clone and install
npm install

# Create environment files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your values

# Run development servers
npm run dev
```

---

## Production Build

### Build Both Apps

```bash
npm run build
```

### Build Individual Apps

```bash
# Server
npm run build:server

# Web
npm run build:web
```

---

## Environment Variables

### Server (apps/server/.env)

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/techscholars
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://techscholars.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.techscholars.com/api/auth/google/callback
```

### Web (apps/web/.env)

```env
NEXT_PUBLIC_API_URL=https://api.techscholars.com
NEXT_PUBLIC_APP_URL=https://techscholars.com
```

---

## Deployment Options

### Option 1: Vercel + Railway/Render

**Frontend (Vercel):**
```bash
cd apps/web
vercel
```

**Backend (Railway/Render):**
1. Connect GitHub repo
2. Set root directory to `apps/server`
3. Add environment variables
4. Deploy

### Option 2: Docker

```dockerfile
# apps/server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Option 3: PM2 (VPS)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start apps/server/dist/index.js --name techscholars-api

# Start web (if not using Vercel)
pm2 start "npm run start" --name techscholars-web
```

---

## MongoDB Atlas Setup

1. Create free cluster at mongodb.com/atlas
2. Create database user
3. Whitelist IP `0.0.0.0/0` (for development) or your server IP
4. Get connection string
5. Update `MONGODB_URI` in server .env

---

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/techscholars

# Web App
server {
    listen 80;
    server_name techscholars.com www.techscholars.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name techscholars.com www.techscholars.com;

    ssl_certificate /etc/letsencrypt/live/techscholars.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/techscholars.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Server
server {
    listen 80;
    server_name api.techscholars.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.techscholars.com;

    ssl_certificate /etc/letsencrypt/live/api.techscholars.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.techscholars.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d techscholars.com -d api.techscholars.com

# Auto-renew
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Health Checks

**API Health:**
```bash
curl https://api.techscholars.com/api/health
# Response: {"status":"ok","timestamp":"..."}
```

**MongoDB Connection:**
```bash
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/techscholars" --eval "db.adminCommand('ping')"
```

---

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Application Logs
```bash
tail -f apps/server/logs/combined.log
tail -f apps/server/logs/error.log
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
lsof -ti:3001 | xargs kill -9
```

### MongoDB Connection Failed
1. Check network connectivity
2. Verify credentials
3. Check IP whitelist in Atlas

### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

---

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS (SSL)
- [ ] Set up rate limiting
- [ ] Configure CORS properly for production
- [ ] Use environment variables for secrets
- [ ] Enable Helmet.js CSP
- [ ] Set up proper CORS origins
- [ ] Enable request logging
- [ ] Set up MongoDB authentication
- [ ] Use strong password policies

---

## Performance Optimization

1. Enable gzip compression in Nginx
2. Set up Redis for session caching (optional)
3. Use CDN for static assets
4. Enable HTTP/2
5. Optimize images
6. Enable browser caching

---

## Backup Strategy

### MongoDB Backup
```bash
# Local backup
mongodump --uri="mongodb://localhost:27017/techscholars" --out=/backup/db

# Atlas backup (automatic with paid plans)
```

### Restore
```bash
mongorestore --uri="mongodb://localhost:27017/techscholars" /backup/db
```
