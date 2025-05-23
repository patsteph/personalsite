# Developer Onboarding Guide

Welcome to the Personal Website project! This guide will help you get up and running quickly with our codebase.

## 🎯 Getting Started Checklist

### Prerequisites Setup

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **Git** configured with your credentials
- [ ] **VS Code** or preferred IDE installed
- [ ] **Firebase account** with project access
- [ ] **GitHub account** with repository access

### Initial Setup (30 minutes)

- [ ] Clone the repository
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Run initial build
- [ ] Start development server
- [ ] Verify all features working

## 🚀 Quick Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone <repository-url>
cd personal-website

# Install dependencies (this may take 2-3 minutes)
npm install

# Verify installation
npm run build
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your Firebase configuration
nano .env.local  # or use your preferred editor
```

### 3. Required Environment Variables

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123

# Firebase Admin Configuration (for API routes)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your_project.iam.gserviceaccount.com

# Optional External APIs
GOOGLE_BOOKS_API_KEY=your_google_books_key
AI_SERVICE_API_KEY=your_ai_service_key
```

### 4. Firebase Setup

1. **Create Firebase Project** at [Firebase Console](https://console.firebase.google.com)
2. **Enable Authentication** with Email/Password provider
3. **Create Firestore Database** in production mode
4. **Generate Service Account Key** for admin access
5. **Configure Security Rules** (see `/firestore-rules.txt`)

### 5. Development Server

```bash
# Generate runtime configuration
npm run generate-runtime-config

# Start development server (http://localhost:3000)
npm run dev

# In another terminal, run tests
npm test
```

## 📁 Project Structure Deep Dive

### Core Directories

```
personal-website/
├── components/           # React components organized by feature
│   ├── admin/           # Admin panel components
│   │   ├── AdminLayout.tsx      # Admin page wrapper
│   │   ├── BlogEditor.tsx       # Blog post editor
│   │   ├── BookForm.tsx         # Book management form
│   │   └── CVEditor.tsx         # CV editing interface
│   ├── blog/            # Blog-related components
│   │   ├── BlogCard.tsx         # Blog post preview card
│   │   ├── BlogList.tsx         # Blog listing component
│   │   └── BlogReactions.tsx    # Like/reaction system
│   ├── books/           # Book collection components
│   │   ├── BookGrid.tsx         # Book grid display
│   │   ├── BookModal.tsx        # Book detail modal
│   │   └── Bookshelf.tsx        # Virtual bookshelf
│   ├── cv/              # CV/Resume components
│   ├── layout/          # Layout and navigation
│   ├── signals/         # Newsletter components
│   └── ui/              # Reusable UI components
```

### Key Configuration Files

```
├── next.config.js       # Next.js configuration with security headers
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Testing configuration
├── package.json         # Dependencies and scripts
└── .eslintrc.json       # Code linting rules
```

## 🧭 Development Workflows

### Feature Development Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Feature**

   - Write component code
   - Add TypeScript types
   - Include unit tests
   - Update documentation

3. **Test Implementation**

   ```bash
   npm test                    # Run unit tests
   npm run test:e2e           # Run E2E tests
   npm run build              # Test production build
   npm run lint               # Check code quality
   ```

4. **Security & Performance**

   ```bash
   node scripts/owasp-security-audit.js  # Security audit
   npm audit                              # Dependency check
   npm run analyze                        # Bundle analysis
   ```

5. **Submit Pull Request**
   - Create descriptive PR title
   - Include feature description
   - Link related issues
   - Request code review

### Daily Development Commands

```bash
# Start development with all services
npm run dev

# Run tests in watch mode
npm test -- --watch

# Check TypeScript errors
npm run type-check

# Format code
npm run format

# Check security
npm audit --audit-level=moderate
```

## 🏗️ Architecture Understanding

### Application Flow

```
User Request ──▶ Next.js Router ──▶ Page Component
     │                                      │
     ▼                                      ▼
Middleware Check ──▶ Authentication ──▶ Component Logic
     │                                      │
     ▼                                      ▼
Security Headers ──▶ API Routes ────▶ Firebase/External APIs
```

### Component Patterns

```typescript
// Standard Component Pattern
interface ComponentProps {
  title: string;
  optional?: boolean;
}

export const MyComponent: React.FC<ComponentProps> = ({ title, optional = false }) => {
  const [state, setState] = useState<string>('');

  return (
    <div className="component-container">
      <h1>{title}</h1>
      {optional && <span>Optional content</span>}
    </div>
  );
};
```

### API Route Pattern

```typescript
// Standard API Route Pattern
import { NextApiRequest, NextApiResponse } from "next";
import { ValidationSchema } from "@/lib/schemas/validation";
import { InputValidator } from "@/lib/security/input-validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate input
    const parseResult = ValidationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Process request
    const result = await processRequest(parseResult.data);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

## 🧪 Testing Guidelines

### Test Structure

```
__tests__/
├── components/          # Component unit tests
│   └── ComponentName.test.tsx
├── lib/                 # Utility function tests
│   └── utils.test.ts
├── integration/         # API and workflow tests
│   └── api-workflow.test.ts
└── e2e/                 # End-to-end tests
    └── user-journey.spec.ts
```

### Writing Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockHandler = jest.fn();
    render(<MyComponent title="Test" onClick={mockHandler} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
```

### Writing API Tests

```typescript
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/endpoint";

describe("/api/endpoint", () => {
  it("handles valid POST request", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { valid: "data" },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      success: true,
    });
  });
});
```

## 🔐 Security Best Practices

### Input Validation

- **Always validate inputs** using Zod schemas
- **Sanitize user content** before display
- **Use TypeScript** for compile-time safety
- **Validate at API boundaries** before processing

### Authentication

- **Check authentication** on all protected routes
- **Validate JWT tokens** on server-side
- **Use Firebase Auth** for user management
- **Implement proper logout** to clear sessions

### Security Headers

- **CSP Policy** prevents XSS attacks
- **HSTS** enforces HTTPS connections
- **Security Headers** configured in `next.config.js`
- **Rate Limiting** prevents abuse

### Code Security

```typescript
// ✅ Good: Proper validation
const parseResult = Schema.safeParse(userInput);
if (!parseResult.success) {
  return res.status(400).json({ error: "Invalid input" });
}

// ❌ Bad: Direct usage without validation
const result = await database.save(req.body);
```

## 🎨 UI/UX Guidelines

### Design System

- **Tailwind CSS** for consistent styling
- **Responsive Design** mobile-first approach
- **Accessibility** WCAG 2.1 AA compliance
- **Component Library** reusable UI components

### Styling Patterns

```typescript
// Component styling pattern
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

### Responsive Design

```css
/* Mobile-first responsive design */
.component {
  @apply text-sm; /* Base: mobile */
  @apply md:text-base; /* Medium: tablet */
  @apply lg:text-lg; /* Large: desktop */
  @apply xl:text-xl; /* Extra large: wide desktop */
}
```

## 🚀 Deployment Understanding

### Deployment Flow

1. **Push to GitHub** triggers CI/CD pipeline
2. **GitHub Actions** runs tests and security checks
3. **Vercel** automatically deploys to preview environment
4. **Main branch** deploys to production
5. **Monitoring** tracks deployment health

### Environment Management

- **Development:** Local development server
- **Preview:** Vercel preview deployments for PRs
- **Production:** Main branch deployment

### Deployment Commands

```bash
# Local production testing
npm run build && npm start

# Manual deployment (if needed)
vercel --prod

# Check deployment status
vercel ls
```

## 🔧 Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### Firebase Connection Issues

```bash
# Verify environment variables
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)"

# Test Firebase connection
npm run test -- firebase.test.ts
```

#### Authentication Problems

- Check Firebase Auth configuration
- Verify JWT token format
- Ensure cookie settings are correct
- Check browser developer tools for errors

#### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Run performance audit
node scripts/performance-audit.js

# Check Core Web Vitals
# Visit /admin/analytics
```

### Getting Help

1. **Check Documentation** in `/docs` folder
2. **Search Existing Issues** in repository
3. **Run Security Audit** for security-related issues
4. **Contact Team** through established channels

## 📚 Learning Resources

### Project-Specific

- [Architecture Decision Records](./ADRs/) - Design decisions
- [API Documentation](./API.md) - API reference
- [Operations Runbook](./RUNBOOK.md) - Operations guide
- [Security Documentation](../SECURITY.md) - Security implementation

### Technology Resources

- **Next.js:** [Official Documentation](https://nextjs.org/docs)
- **React:** [React Docs](https://react.dev)
- **TypeScript:** [TS Handbook](https://www.typescriptlang.org/docs)
- **Firebase:** [Firebase Docs](https://firebase.google.com/docs)
- **Testing:** [Testing Library](https://testing-library.com/docs/)

### Best Practices

- **Security:** [OWASP Guidelines](https://owasp.org/)
- **Performance:** [Web.dev](https://web.dev/)
- **Accessibility:** [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## ✅ Onboarding Completion

### Verification Checklist

- [ ] Development server running successfully
- [ ] All tests passing
- [ ] Firebase connection working
- [ ] Admin panel accessible
- [ ] Security audit passes
- [ ] Code changes can be made and tested
- [ ] Pull request workflow understood

### Next Steps

1. **Explore Codebase** - Browse components and understand structure
2. **Run Tests** - Familiarize yourself with test suite
3. **Make Small Change** - Try a minor improvement
4. **Review Documentation** - Read architecture decisions
5. **Join Team** - Participate in team meetings and discussions

**Welcome to the team! 🎉**

---

**Need Help?** Contact the development team or check the troubleshooting section above.

**Last Updated:** January 2025  
**Onboarding Version:** 1.0
