# Operations Runbook

## 📋 Overview

This runbook provides operational procedures for maintaining, monitoring, and troubleshooting the Personal Website application. It's designed for developers, operations teams, and anyone responsible for keeping the application running smoothly.

### Application Architecture

- **Frontend:** Next.js 15 deployed on Vercel
- **Backend:** Next.js API routes with Firebase services
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **CDN:** Vercel Edge Network
- **Monitoring:** Custom analytics + Firebase Analytics

## 🚀 Deployment Operations

### Production Deployment Process

#### Automated Deployment (Normal)

```bash
# Standard deployment process
1. Create pull request with changes
2. Automated tests run on PR
3. Code review and approval
4. Merge to main branch
5. Automatic deployment to production
6. Post-deployment health checks
```

#### Manual Deployment (Emergency)

```bash
# Emergency manual deployment
git checkout main
git pull origin main
npm run build
vercel --prod --confirm

# Verify deployment
curl -I https://yoursite.com/api/monitoring/health
```

#### Rollback Procedure

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Verify rollback
curl -I https://yoursite.com/api/monitoring/health
```

### Environment Management

#### Development Environment

```bash
# Start local development
npm run dev

# Run with debug logging
DEBUG=* npm run dev

# Test production build locally
npm run build && npm start
```

#### Environment Variables

```bash
# Check environment variables
vercel env ls

# Add new environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME
```

## 📊 Monitoring & Alerting

### Health Checks

#### Application Health

```bash
# Basic health check
curl https://yoursite.com/api/monitoring/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "auth": "healthy",
    "storage": "healthy"
  }
}
```

#### Database Health

```bash
# Check Firebase connection
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://yoursite.com/api/admin/dashboard-stats

# Verify Firestore operations
node scripts/test-firebase-connection.js
```

#### API Endpoint Health

```bash
# Test critical endpoints
curl https://yoursite.com/api/public-books
curl https://yoursite.com/api/blog
curl https://yoursite.com/api/signals
```

### Performance Monitoring

#### Core Web Vitals

- **Access:** `/admin/analytics` dashboard
- **Metrics:** FCP, LCP, FID, CLS, TTFB
- **Targets:**
  - FCP < 1.8s
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

#### API Performance

```bash
# Monitor API response times
curl -w "@curl-format.txt" -s -o /dev/null \
  https://yoursite.com/api/blog

# Expected response times
# Blog API: < 200ms
# Books API: < 300ms
# Admin APIs: < 500ms
```

### Error Monitoring

#### Application Errors

- **Dashboard:** `/admin/analytics`
- **Log Location:** Vercel Functions logs
- **Alert Threshold:** > 1% error rate

#### Common Error Patterns

```bash
# Check for authentication errors
grep "auth error" logs/

# Check for validation errors
grep "validation failed" logs/

# Check for database errors
grep "firestore error" logs/
```

## 🔐 Security Operations

### Security Monitoring

#### Failed Authentication Attempts

```bash
# Monitor auth failures
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://yoursite.com/api/monitoring/security

# Alert conditions:
# - > 10 failed attempts from same IP in 1 hour
# - Admin login from unusual location
# - Multiple concurrent admin sessions
```

#### Security Audit

```bash
# Run comprehensive security audit
node scripts/owasp-security-audit.js

# Expected security grade: A (90+/100)
# Alert if grade drops below B (80/100)
```

#### Vulnerability Scanning

```bash
# Check for dependency vulnerabilities
npm audit --audit-level=moderate

# Update vulnerable dependencies
npm audit fix

# Check for critical vulnerabilities
npm audit --audit-level=critical
```

### Security Incident Response

#### Suspected Security Breach

1. **Immediate Actions:**

   ```bash
   # Revoke all admin sessions
   # Reset admin passwords
   # Enable additional monitoring
   # Document incident timeline
   ```

2. **Investigation:**

   - Check access logs for unusual patterns
   - Verify data integrity
   - Review recent deployments
   - Check for unauthorized changes

3. **Communication:**
   - Notify security team
   - Prepare user communication if needed
   - Document findings and remediation

## 🛠️ Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check deployment status
vercel ls

# Check build logs
vercel logs [deployment-url]

# Common fixes:
# 1. Check environment variables
# 2. Verify Firebase configuration
# 3. Check for syntax errors in code
```

#### Database Connection Issues

```bash
# Test Firebase connection
node -e "
  const { getAdminFirestore } = require('./lib/firebase-admin');
  const db = getAdminFirestore();
  console.log('Firebase connected:', !!db);
"

# Common fixes:
# 1. Verify Firebase service account key
# 2. Check network connectivity
# 3. Verify Firestore security rules
```

#### Authentication Problems

```bash
# Test auth service
curl -X POST https://yoursite.com/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'

# Common fixes:
# 1. Check Firebase Auth configuration
# 2. Verify JWT token format
# 3. Check cookie settings
# 4. Verify CORS configuration
```

#### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Check API response times
for endpoint in blog books signals; do
  echo "Testing $endpoint:"
  curl -w "%{time_total}\n" -o /dev/null -s \
    https://yoursite.com/api/$endpoint
done

# Common fixes:
# 1. Optimize database queries
# 2. Implement caching
# 3. Reduce bundle size
# 4. Optimize images
```

### Debugging Procedures

#### API Debugging

```javascript
// Enable debug logging in API routes
console.log("API Request:", {
  method: req.method,
  url: req.url,
  body: req.body,
  headers: req.headers,
});
```

#### Client-Side Debugging

```javascript
// Enable React debugging
localStorage.setItem("debug", "true");

// Check console for errors
// Verify network requests in DevTools
// Check Firebase connection status
```

#### Database Debugging

```bash
# Check Firestore operations
node scripts/debug-firestore.js

# Verify security rules
firebase firestore:rules:get

# Test queries manually
firebase firestore:data:export backup-$(date +%s)
```

## 📈 Performance Optimization

### Regular Maintenance

#### Weekly Tasks

```bash
# 1. Check security audit results
node scripts/owasp-security-audit.js

# 2. Review performance metrics
# Visit /admin/analytics

# 3. Update dependencies
npm update

# 4. Check error rates
# Review Vercel dashboard
```

#### Monthly Tasks

```bash
# 1. Comprehensive security review
npm audit --audit-level=low

# 2. Performance analysis
npm run analyze

# 3. Database cleanup
node scripts/cleanup-old-data.js

# 4. Backup verification
# Test Firebase backup restoration
```

#### Quarterly Tasks

- Security penetration testing
- Disaster recovery testing
- Performance benchmarking
- Documentation updates

### Optimization Procedures

#### Bundle Size Optimization

```bash
# Analyze current bundle
npm run analyze

# Optimize strategies:
# 1. Dynamic imports for large components
# 2. Remove unused dependencies
# 3. Code splitting optimization
# 4. Tree shaking verification
```

#### Database Optimization

```bash
# Check query performance
# Review Firestore usage metrics
# Optimize indexes
# Implement caching where appropriate
```

#### CDN Optimization

```bash
# Check cache hit rates
curl -I https://yoursite.com/

# Optimize cache headers
# Verify static asset optimization
# Check image optimization results
```

## 💾 Backup & Recovery

### Backup Procedures

#### Database Backup

```bash
# Manual Firestore backup
firebase firestore:data:export gs://backup-bucket/$(date +%s)

# Automated daily backups configured in Firebase Console
# Retention: 30 days
# Location: Multi-region storage
```

#### Code Backup

```bash
# Verify Git repository backup
git remote -v

# Multiple remotes recommended:
# - GitHub (primary)
# - GitLab (secondary)
# - Local backup server
```

#### Configuration Backup

```bash
# Export environment variables
vercel env ls > env-backup-$(date +%s).txt

# Backup deployment configuration
cp vercel.json vercel-backup-$(date +%s).json
```

### Recovery Procedures

#### Data Recovery

```bash
# Restore from Firestore backup
firebase firestore:data:import gs://backup-bucket/[backup-id]

# Verify data integrity after restore
node scripts/verify-data-integrity.js
```

#### Application Recovery

```bash
# Deploy from backup
git checkout [backup-commit]
vercel --prod

# Verify application functionality
npm test
curl https://yoursite.com/api/monitoring/health
```

## 📞 Escalation Procedures

### Incident Severity Levels

#### Severity 1 (Critical)

- **Definition:** Complete service outage
- **Response Time:** 15 minutes
- **Actions:**
  1. Immediate rollback if recent deployment
  2. Activate incident response team
  3. Notify stakeholders
  4. Implement emergency fix

#### Severity 2 (High)

- **Definition:** Major functionality impaired
- **Response Time:** 1 hour
- **Actions:**
  1. Assess impact and scope
  2. Implement workaround if possible
  3. Plan and execute fix
  4. Monitor for resolution

#### Severity 3 (Medium)

- **Definition:** Minor functionality issues
- **Response Time:** 24 hours
- **Actions:**
  1. Log issue for tracking
  2. Plan fix in next maintenance window
  3. Communicate to affected users

### Contact Information

#### Primary Contacts

- **Development Team:** developers@example.com
- **Operations Team:** ops@example.com
- **Security Team:** security@example.com

#### External Services

- **Vercel Support:** https://vercel.com/support
- **Firebase Support:** https://firebase.google.com/support
- **Domain Registrar:** [Domain provider support]

## 📚 Reference Documentation

### Quick Reference Links

- [Project Documentation](./README.md)
- [API Documentation](./API.md)
- [Security Documentation](../SECURITY.md)
- [Architecture Decision Records](./ADRs/)

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

### Monitoring Dashboards

- **Application:** `/admin/analytics`
- **Vercel:** https://vercel.com/dashboard
- **Firebase:** https://console.firebase.google.com

---

**Last Updated:** January 2025  
**Version:** 2.0  
**On-Call:** Development Team  
**Emergency Contact:** [Emergency contact information]
