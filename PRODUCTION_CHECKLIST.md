# TechScholars Production Checklist

## Pre-Deployment

### Code Review
- [ ] All TypeScript errors fixed (`npm run typecheck`)
- [ ] All unit tests passing (`npm test`)
- [ ] ESLint warnings resolved (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] All sensitive data removed from code

### Environment Setup
- [ ] Production `.env` files created
- [ ] JWT secrets are unique and strong (32+ chars)
- [ ] MongoDB credentials secured
- [ ] Google OAuth credentials configured
- [ ] CORS origins set correctly for production domain

### Security
- [ ] Helmet.js CSP configured
- [ ] Rate limiting enabled
- [ ] JWT expiration set appropriately
- [ ] Password hashing using bcrypt
- [ ] SQL injection prevention (Mongoose sanitization)
- [ ] XSS protection enabled
- [ ] HTTPS enforced (SSL certificates)

### Performance
- [ ] Static assets minified
- [ ] Images optimized
- [ ] Gzip compression enabled
- [ ] Browser caching configured
- [ ] Database indexes created
- [ ] Cache middleware active
- [ ] CDN configured for static files

## Server Setup

### Process Management
- [ ] PM2 installed for process management
- [ ] Startup scripts configured
- [ ] Log rotation configured
- [ ] Memory limits set

### Monitoring
- [ ] Error tracking (Sentry/LogRocket)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Database
- [ ] MongoDB authentication enabled
- [ ] Backup strategy configured
- [ ] Connection pooling optimized
- [ ] Read preference configured

## Frontend Setup

### Vercel/Deployment
- [ ] Environment variables configured
- [ ] Build succeeds (`npm run build`)
- [ ] Preview deployments working
- [ ] Production deployment successful

### SEO
- [ ] Meta tags configured
- [ ] Open Graph tags set
- [ ] Sitemap generated
- [ ] robots.txt configured
- [ ] Canonical URLs set

### PWA (Optional)
- [ ] Service worker configured
- [ ] Manifest file created
- [ ] Offline support added

## Post-Deployment

### Verification
- [ ] Health check endpoint working
- [ ] API endpoints responding correctly
- [ ] Database connections stable
- [ ] WebSocket connections working
- [ ] Authentication flow complete

### Load Testing
- [ ] Basic load test completed
- [ ] API response times acceptable
- [ ] No memory leaks detected
- [ ] Database connections stable under load

### Documentation
- [ ] API documentation updated
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Emergency contacts listed

## Monitoring Setup

### Alerts
- [ ] Server downtime alerts
- [ ] High error rate alerts
- [ ] Database connection alerts
- [ ] Disk space alerts

### Dashboards
- [ ] Server metrics dashboard
- [ ] API usage dashboard
- [ ] User activity dashboard
- [ ] Performance metrics

## Rollback Plan

### Pre-Deployment
- [ ] Previous version backed up
- [ ] Rollback procedure documented
- [ ] Database migration rollback plan ready

### If Issues Occur
1. Check logs: `pm2 logs` or `tail -f logs/combined.log`
2. Check metrics: `pm2 monit`
3. If critical: `pm2 stop all && pm2 resurrect`

## Success Criteria

- [ ] All tests passing in production
- [ ] Response time < 200ms for API
- [ ] 99.9% uptime target
- [ ] Zero critical security vulnerabilities
- [ ] All features functional

---

## Quick Commands

```bash
# Check health
curl https://api.techscholars.com/api/health

# View logs
tail -f apps/server/logs/combined.log

# Restart services
pm2 restart all

# Check status
pm2 status
```
