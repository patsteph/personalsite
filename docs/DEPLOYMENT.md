# Deployment Guide

## 📋 Overview

This guide provides comprehensive deployment procedures for the Personal Website application, covering development, staging, and production environments.

## 🏗️ Deployment Architecture

### Platform Overview

- **Primary Platform:** Vercel (Frontend + API Routes)
- **Backend Services:** Firebase (Database, Auth, Storage)
- **CDN:** Vercel Edge Network
- **Domain Management:** Custom domain with SSL/TLS
- **CI/CD:** GitHub Actions + Vercel integration

### Environment Structure

```
Development     Staging/Preview     Production
├── Local       ├── PR Previews     ├── Main Branch
├── Hot Reload  ├── Feature Test    ├── Custom Domain
├── Debug Mode  ├── Staging Data    ├── Production Data
└── Dev Config  └── Staging Config  └── Prod Config
```

## 🚀 Quick Deployment

### Automated Deployment (Recommended)

```bash
# Standard workflow
1. Create feature branch
   git checkout -b feature/your-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add new feature"

3. Push to GitHub
   git push origin feature/your-feature

4. Create Pull Request
   # Automatic preview deployment created

5. Review and merge
   # Automatic production deployment
```

### Manual Deployment (Emergency)

```bash
# Direct production deployment
vercel --prod

# Deploy specific branch
git checkout main
git pull origin main
vercel --prod --confirm
```

## 🔧 Environment Setup

### Development Environment

#### Prerequisites

```bash
# Required software
- Node.js 18+ (recommended: 18.17.0)
- npm 9+
- Git 2.30+
- VS Code (recommended)
```

#### Local Setup

```bash
# Clone repository
git clone <repository-url>
cd personal-website

# Install dependencies
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate runtime config
npm run generate-runtime-config

# Start development server
npm run dev
```

#### Local Environment Variables

```env
# .env.local - Development configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_dev_project.iam.gserviceaccount.com
NODE_ENV=development
```

### Staging Environment

#### Preview Deployments

```bash
# Automatic preview for every PR
# URL format: https://personal-website-pr-123.vercel.app

# Manual preview deployment
vercel

# Preview with specific branch
git checkout feature-branch
vercel
```

#### Staging Configuration

```env
# Staging environment variables
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_staging_project
NODE_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
```

### Production Environment

#### Production Configuration

```env
# Production environment variables (Vercel dashboard)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_prod_project
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yoursite.com
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
CUSTOM_DOMAIN=yoursite.com
```

#### Domain Setup

```bash
# Add custom domain in Vercel dashboard
1. Go to Project Settings > Domains
2. Add yoursite.com
3. Configure DNS records:
   - A record: @ -> 76.76.19.19
   - CNAME: www -> cname.vercel-dns.com

# SSL/TLS automatically provisioned by Vercel
```

## 📦 Build Process

### Build Configuration

#### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: ["your-image-domain.com"],
    formats: ["image/webp", "image/avif"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true,
      },
    ];
  },
};
```

#### Build Scripts

```json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "prebuild": "npm run generate-runtime-config && npm run generate-standard-config && npm run generate-secure-config",
    "postbuild": "next-sitemap"
  }
}
```

### Build Process Steps

```bash
1. Pre-build scripts
   - Generate runtime configuration
   - Generate environment-specific configs
   - Validate environment variables

2. Next.js build
   - TypeScript compilation
   - Code bundling and optimization
   - Static page generation
   - Image optimization

3. Post-build
   - Generate sitemap
   - Run security checks
   - Validate build output
```

### Build Optimization

```bash
# Analyze bundle size
npm run build:analyze

# Check bundle composition
npx @next/bundle-analyzer

# Optimize strategies:
# 1. Dynamic imports for large components
# 2. Tree shaking unused code
# 3. Image optimization
# 4. Font optimization
```

## 🔐 Security Deployment

### Environment Variables Security

```bash
# Secure variable management
1. Use Vercel environment variables for secrets
2. Never commit sensitive data to repository
3. Use different secrets for each environment
4. Regularly rotate API keys and tokens

# Add production secrets
vercel env add FIREBASE_PRIVATE_KEY production
vercel env add GOOGLE_BOOKS_API_KEY production
```

### Security Headers Deployment

```javascript
// Security headers in production
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'nonce-xyz'; style-src 'self' 'unsafe-inline';",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];
```

### SSL/TLS Configuration

```bash
# Automatic SSL with Vercel
1. SSL certificates automatically provisioned
2. HTTP to HTTPS redirect enabled
3. HSTS headers configured
4. Certificate auto-renewal

# Verify SSL configuration
curl -I https://yoursite.com
# Should return: Strict-Transport-Security header
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Build application
        run: npm run build

      - name: Run security checks
        run: node scripts/owasp-security-audit.js

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Deploy to Preview
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

### Pipeline Security

```bash
# Required secrets in GitHub
VERCEL_TOKEN=<vercel_deploy_token>
ORG_ID=<vercel_organization_id>
PROJECT_ID=<vercel_project_id>

# Security measures
1. Secrets stored securely in GitHub
2. Limited access to deployment tokens
3. Audit trail for all deployments
4. Automated security scanning
```

## 📊 Deployment Monitoring

### Health Checks

```bash
# Automated health checks after deployment
curl -f https://yoursite.com/api/monitoring/health || exit 1

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

### Performance Monitoring

```bash
# Core Web Vitals monitoring
# Check /admin/analytics after deployment

# Key metrics to monitor:
# - First Contentful Paint (FCP) < 1.8s
# - Largest Contentful Paint (LCP) < 2.5s
# - First Input Delay (FID) < 100ms
# - Cumulative Layout Shift (CLS) < 0.1
```

### Error Monitoring

```bash
# Monitor error rates post-deployment
# Alert if error rate > 1% for 5 minutes
# Check Vercel dashboard for function errors
# Monitor Firebase console for database errors
```

## 🔧 Troubleshooting Deployments

### Common Deployment Issues

#### Build Failures

```bash
# TypeScript errors
npm run type-check

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Environment variable issues
vercel env ls
vercel env add MISSING_VAR production
```

#### Deployment Failures

```bash
# Vercel deployment issues
vercel logs <deployment-url>

# Check project configuration
cat vercel.json

# Verify domain configuration
vercel domains ls
```

#### Runtime Issues

```bash
# Check function logs
vercel logs --follow

# Test API endpoints
curl https://yoursite.com/api/monitoring/health

# Check Firebase connectivity
node -e "
  const { getAdminFirestore } = require('./lib/firebase-admin');
  console.log('Firebase status:', !!getAdminFirestore());
"
```

### Rollback Procedures

#### Immediate Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <previous-deployment-url>

# Verify rollback
curl -I https://yoursite.com/
```

#### Database Rollback

```bash
# If database changes were made
firebase firestore:data:export backup-pre-rollback
# Restore from previous backup if needed
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Performance benchmarks acceptable

### Deployment

- [ ] CI/CD pipeline passed
- [ ] Preview deployment reviewed
- [ ] Production deployment completed
- [ ] Health checks passed
- [ ] DNS propagation verified

### Post-Deployment

- [ ] Application functionality verified
- [ ] Performance metrics checked
- [ ] Error rates monitored
- [ ] User experience validated
- [ ] Documentation updated
- [ ] Team notified of deployment

## 🔄 Emergency Procedures

### Emergency Deployment

```bash
# Skip CI/CD for critical fixes
git checkout main
git pull origin main

# Apply emergency fix
git add .
git commit -m "hotfix: critical security fix"
git push origin main

# Manual deployment if needed
vercel --prod --confirm
```

### Disaster Recovery

```bash
# Complete service restoration
1. Restore from Git backup
2. Restore database from backup
3. Reconfigure environment variables
4. Deploy to new infrastructure if needed
5. Update DNS if infrastructure changed
```

## 📚 Additional Resources

### Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

### Monitoring Dashboards

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Firebase Console:** https://console.firebase.google.com
- **Application Analytics:** `/admin/analytics`

### Support Contacts

- **Platform Support:** Vercel Support
- **Development Team:** developers@example.com
- **Operations Team:** ops@example.com

---

**Last Updated:** January 2025  
**Version:** 2.0  
**Deployment Platform:** Vercel + Firebase  
**Status:** Production Ready
