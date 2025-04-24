<div align="center">

# Patrick Stephens - Personal Website

[![Vercel Status](https://img.shields.io/github/deployments/patsteph/personal-website/production?logo=vercel&label=vercel&style=for-the-badge)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![OpenAI](https://img.shields.io/badge/AI_Powered-OpenAI-412991?style=for-the-badge&logo=openai)](https://openai.com/)

![Website Screenshot](public/images/headers/welcome.jpg)

</div>

A modern, responsive personal website built with Next.js, TypeScript, Tailwind CSS, and Firebase. This full-stack application showcases my professional experience, book collection, blog posts, and curated signals, powered by AI-enhanced features for content recommendations and management.

## ✨ Features

<div align="center">
<table>
<tr>
  <td>
    <h3>📱 Responsive Design</h3>
    <p>Clean two-column layout that adapts beautifully to all devices with mobile-first approach</p>
  </td>
  <td>
    <h3>📚 Interactive Bookshelf</h3>
    <p>Virtual bookshelf displaying reading collection with AI-powered recommendations</p>
  </td>
</tr>
<tr>
  <td>
    <h3>🤖 AI Integration</h3>
    <p>OpenAI-powered features including book recommendations and blog content assistant</p>
  </td>
  <td>
    <h3>✏️ Blog Platform</h3>
    <p>Markdown-based blog with featured images, syntax highlighting, and reactions</p>
  </td>
</tr>
<tr>
  <td>
    <h3>📄 CV Management</h3>
    <p>Professional experience, skills, and education with admin editor interface</p>
  </td>
  <td>
    <h3>📡 Signals</h3>
    <p>Curated collection of newsletters and articles with filtering and tagging</p>
  </td>
</tr>
<tr>
  <td>
    <h3>🌐 Multi-language</h3>
    <p>Content localization for English, Spanish, German, Japanese, and Ukrainian</p>
  </td>
  <td>
    <h3>🔒 Secure Admin</h3>
    <p>Firebase authentication with server-side protection and role-based access</p>
  </td>
</tr>
<tr>
  <td>
    <h3>📊 Analytics Dashboard</h3>
    <p>Track user engagement, page views, and content performance</p>
  </td>
  <td>
    <h3>🚀 Optimized Build</h3>
    <p>Static site generation with incremental regeneration for optimal performance</p>
  </td>
</tr>
</table>
</div>

## 🛠️ Technology Stack

<div align="center">
<table>
<tr>
  <td align="center" width="96">
    <img src="https://techstack-generator.vercel.app/react-icon.svg" alt="React" width="65" height="65" />
    <br>React
  </td>
  <td align="center" width="96">
    <img src="https://techstack-generator.vercel.app/ts-icon.svg" alt="TypeScript" width="65" height="65" />
    <br>TypeScript
  </td>
  <td align="center" width="96">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" alt="Next.js" width="65" height="65" />
    <br>Next.js 15
  </td>
  <td align="center" width="96">
    <img src="https://cdn.worldvectorlogo.com/logos/tailwindcss.svg" alt="Tailwind CSS" width="65" height="65" />
    <br>Tailwind
  </td>
  <td align="center" width="96">
    <img src="https://techstack-generator.vercel.app/firebase-icon.svg" alt="Firebase" width="65" height="65" />
    <br>Firebase
  </td>
</tr>
<tr>
  <td align="center" width="96">
    <img src="https://user-images.githubusercontent.com/25181517/192108372-f71d70ac-7ae6-4c0d-8395-51d8870c2ef0.png" alt="Git" width="65" height="65" />
    <br>Git
  </td>
  <td align="center" width="96">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/jest/jest-plain.svg" alt="Jest" width="65" height="65" />
    <br>Jest
  </td>
  <td align="center" width="96">
    <img src="https://techstack-generator.vercel.app/eslint-icon.svg" alt="ESLint" width="65" height="65" />
    <br>ESLint
  </td>
  <td align="center" width="96">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/markdown/markdown-original.svg" alt="MDX" width="65" height="65" />
    <br>MDX
  </td>
  <td align="center" width="96">
    <img src="https://www.vectorlogo.zone/logos/openai/openai-icon.svg" alt="OpenAI" width="65" height="65" />
    <br>OpenAI
  </td>
</tr>
</table>
</div>

### Core Technologies

- **Next.js 15**: Full-stack React framework with App Router, Server Components, and optimized builds
- **TypeScript**: End-to-end type safety for robust code quality and enhanced developer experience
- **Tailwind CSS**: Utility-first framework for responsive, maintainable UI development
- **Firebase**: Complete backend solution with Authentication, Firestore, and Storage
- **AI Integration**: Modular AI architecture supporting OpenAI, Anthropic, and expandable to other providers
- **MDX**: Enhanced Markdown for blog content with React component support

## 🏛️ Architecture Overview

### System Architecture

The website follows a modern full-stack architecture with clear separation between client and server components, secure API endpoints, and multi-layered security.

```mermaid
flowchart TD
    Client[Client Layer] --> Auth[Auth Context]
    Client --> UI[UI Components]
    UI --> Hooks[Custom Hooks]
    Auth --> Token[Token Management]
    Hooks --> API[API Client]
    API --> Fetch[fetch with credentials]
    Fetch --> ServerAPI[Server API Layer]
    
    subgraph Backend
        ServerAPI --> Middleware[Auth Middleware]
        Middleware --> Handlers[API Handlers]
        Handlers --> FirebaseAdmin[Firebase Admin SDK]
        Handlers --> AIService[AI Services]
        FirebaseAdmin --> Firestore[(Firestore DB)]
        AIService --> OpenAI[OpenAI API]
    end
    
    style Backend fill:#f4f4f9,stroke:#333,stroke-width:2px
```

### API and Data Flow

The application uses a tiered API approach with proper separation of concerns between client and server operations.

```mermaid
flowchart LR
    A[Client Component] --> B[API Client Module\nlib/api/*];
    B --> C[fetch with credentials];
    C --> D[Next.js API Route\npages/api/*];
    
    subgraph Server-Side
        D --> E[Auth Check];
        E -->|Authenticated| F[Process Request];
        F --> G1[Firestore Operations] & G2[OpenAI Integration] & G3[External APIs];
        G1 & G2 & G3 --> H[Format Response];
        E -->|Unauthorized| U[Return 401];
    end
    
    H --> I[Return Data];
    I --> C;
    C --> B;
    B --> A;
    U --> C;
    
    style Server-Side fill:#f9f0ff,stroke:#333,stroke-width:2px
```

### Key Architectural Aspects

- **Enhanced API Client**: Functions in `lib/api/*` include authentication headers and proper error handling
- **Secure API Routes**: All admin routes validate auth tokens server-side and restrict access based on user roles
- **Tiered AI Services**: 
  - Admin features use configurable AI providers (OpenAI/Anthropic) with provider selection
  - Public features use cost-optimized models (gpt-4.1-nano) for better performance/cost ratio
- **Server-Side Validation**: All data is validated and sanitized on both client and server
- **Cookies for Auth**: Session cookies handle authentication state instead of localStorage

### Authentication Flow

The website implements a comprehensive authentication system with multiple security layers:

```mermaid
flowchart TD
    A[User] -->|Access Admin Page| B[Edge Middleware]
    B -->|Check Auth Cookie| C{Cookie Valid?}
    C -->|No| D[Redirect to Login]
    C -->|Yes| E[Auth Context Check]
    E -->|Valid Session| F[Render Admin UI]
    E -->|Invalid| D
    
    F -->|API Request| G[API Endpoint]
    G -->|validateAuthToken| H{Server Validation}
    H -->|Valid| I[Perform Operation]
    H -->|Invalid| J[Return 401]
    
    K[Login Form] -->|Submit| L[Firebase Auth]
    L -->|Success| M[Set Auth Cookie]
    M --> N[Redirect to Admin]
```

1. **Edge Middleware**: First defense layer at the network edge
2. **Auth Context Provider**: Client-side session management with auto-refresh
3. **Cookie-Based Auth**: Secure HTTP-only cookies for session state
4. **Server-Side Verification**: API endpoints independently verify auth tokens
5. **Role-Based Access**: Different permission levels for various admin functions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/patsteph/personal-website.git
   cd personal-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file by copying `.env.local.example` and filling in your Firebase credentials:

   ```env
   # Firebase Client Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Firebase Admin SDK (for API routes - currently stubbed)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

   # Site URL (Important for Server-Side API Calls during Build)
   # Use http://localhost:3000 for local development build
   # Use your production domain (e.g., https://yourdomain.com) for production builds
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Contact Info
   NEXT_PUBLIC_CONTACT_EMAIL=your-email@example.com

   # Base Path (if deploying to a subdirectory, e.g., /personalsite)
   NEXT_PUBLIC_BASE_PATH=
   
   # Content Security Policy (optional)
   NEXT_PUBLIC_ENABLE_STRICT_CSP=false
   ```

4. **Create an admin user in Firebase Authentication**

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000) to see your website**

## 💡 Project Structure

```
personal-website/
├── components/            # React components organized by feature
│   ├── admin/             # Admin dashboard and management components
│   ├── blog/              # Blog post display and interaction components
│   ├── books/             # Book collection and recommendation components
│   ├── contact/           # Contact form and related components
│   ├── cv/                # CV/Resume display and editor components
│   ├── easter-eggs/        # Easter egg implementations and triggers
│   ├── layout/            # Layout components (headers, footers, navigation)
│   ├── signals/           # Signal curation and display components
│   └── ui/                # Reusable UI components and design system
├── content/               # Static content (blog posts, default data)
├── lib/                   # Core functionality and business logic
│   ├── ai/                # AI service implementation for various features
│   │   ├── ai-service.ts     # Provider-agnostic AI service abstraction
│   │   ├── blog-assistant.ts # Blog content creation assistant
│   │   └── book-recommender.ts # Book recommendation engine
│   ├── api/               # API client modules for data access
│   ├── auth.tsx           # Authentication context and hooks (client-side)
│   ├── firebase-client.ts  # Firebase client initialization
│   ├── firebase-admin.ts  # Firebase Admin SDK for server-side operations
│   ├── hooks/             # Custom React hooks for shared functionality
│   ├── tracking.ts        # Analytics and event tracking implementation
│   ├── translations.tsx    # Multi-language support with i18n
│   └── utils/             # Utility functions and helpers
├── middleware.js          # Edge middleware for route protection and redirects
├── pages/                 # Next.js page components and API routes
│   ├── admin/             # Admin pages (protected with authentication)
│   ├── api/               # Server-side API endpoints
│   │   ├── admin/          # Admin-only API endpoints (protected)
│   │   ├── ai/             # AI-related API endpoints
│   │   ├── auth/           # Authentication API endpoints
│   │   └── ...             # Other API endpoints
│   ├── blog/              # Blog pages and article views
│   ├── books/             # Book collection and recommendation pages
│   └── ...                # Other public-facing pages
├── public/                # Static assets and client-side config
│   ├── images/            # Image files organized by category
│   └── locales/           # Translation files for supported languages 
├── scripts/               # Build and deployment scripts
├── styles/                # Global styles and Tailwind configuration
├── types/                 # TypeScript type definitions
├── __tests__/             # Test suite with Jest and Testing Library
└── __mocks__/             # Mock implementations for testing
```

## 🔌 Key Features Explained

### AI-Powered Book Recommendations

<div align="center">
<img src="public/images/icons/book.svg" alt="Book Recommendation" width="80" />
</div>

The bookshelf goes beyond just displaying books with an intelligent recommendation system:

- **Extensible AI Architecture**: Built to support multiple AI providers - add your own Anthropic, Cohere, or other AI provider keys
- **Smart Recommendation Engine**: Powered by OpenAI's gpt-4.1-nano model for cost-effective, high-quality recommendations
- **Preference Learning**: Analyzes reading history, ratings, and genres to suggest personalized books
- **Duplicate Detection**: Prevents adding the same book twice with intelligent ISBN and title matching
- **Google Books API Integration**: Automatic metadata retrieval by ISBN or title search
- **Rich Filtering System**: Filter by read status, genre, author, rating, and more
- **Personal Notes**: Add private notes and thoughts about each book

### Admin Dashboard with Analytics

<div align="center">
<img src="public/images/icons/chart.svg" alt="Analytics" width="80" />
</div>

The enhanced admin interface provides full site management:

- **Real-time Analytics**: Track page views, traffic sources, and user engagement
- **Blog Management**: Create, edit, and publish articles with an AI writing assistant
- **CV Editor**: Update professional experience and skills with a visual editor
- **Book Collection Management**: Add, edit, and categorize books in your collection
- **User Feedback Analysis**: Review and categorize user feedback with sentiment analysis
- **Content Performance**: Monitor which content performs best with your audience

### AI Blog Assistant

<div align="center">
<img src="public/images/icons/ai.svg" alt="AI Assistant" width="80" />
</div>

The blog platform leverages AI to enhance content creation:

- **Extensible Multi-Provider Architecture**: Swap between AI providers with a unified interface
- **Built-in Support**: OpenAI GPT and Anthropic Claude integration ready to use
- **Provider Selection UI**: Admin users can choose their preferred AI model in the interface
- **Content Generation**: Get AI assistance for blog post ideas, outlines, and drafts
- **Markdown Integration**: Seamless transition between AI suggestions and Markdown editor
- **Code Optimization**: Improve code snippets in technical posts
- **SEO Suggestions**: Get AI-powered recommendations for better search visibility
- **Multi-language Support**: Create and translate content across five supported languages

### Interactive CV Management

<div align="center">
<img src="public/images/icons/cv.svg" alt="CV Management" width="80" />
</div>

The CV section offers a complete professional profile management system:

- **Visual CV Editor**: Add and organize experience, skills, and education
- **PDF Export**: Generate professional PDF versions of your CV
- **Skill Visualization**: Interactive skill categorization and level indicators
- **Timeline View**: Visual representation of career progression
- **Testimonials**: Showcase recommendations and endorsements
- **Project Portfolio**: Highlight key projects with descriptions and technologies

## 🔐 Security Implementation

<div align="center">
<table>
<tr>
  <td align="center">
    <img src="public/images/icons/lock.svg" alt="Security" width="50" height="50" />
    <h3>Authentication</h3>
  </td>
  <td align="center">
    <img src="public/images/icons/shield.svg" alt="API Protection" width="50" height="50" />
    <h3>API Protection</h3>
  </td>
  <td align="center">
    <img src="public/images/icons/key.svg" alt="Key Management" width="50" height="50" />
    <h3>Key Management</h3>
  </td>
</tr>
</table>
</div>

### Multi-Layer Authentication System

- **Cookie-Based Auth**: Secure HTTP-only cookies instead of localStorage tokens
- **Server-Side Validation**: All admin API endpoints validate session tokens 
- **Edge Protection**: Middleware enforces authentication at the network edge
- **Role-Based Access Control**: Different permission levels for various admin functions
- **Auto Session Refresh**: Background token refresh keeps sessions secure

### API Security Architecture

- **Request Validation**: All inputs are sanitized and validated server-side
- **CORS Protection**: Strict origin policies prevent cross-site request forgery
- **Rate Limiting**: API endpoints are protected against abuse with request limits
- **Error Sanitization**: Sensitive information is removed from error responses
- **Content Security Policy**: Strict CSP headers to prevent injection attacks

### Sensitive Information Handling

- **Environment Variables**: All credentials stored in environment variables
- **Secret Rotation**: Regular rotation of API keys and secrets
- **Secure Builds**: Runtime configuration generation with secret protection
- **Least Privilege**: Admin SDK uses minimal required permissions
- **Audit Logging**: All authentication attempts are logged for security review

## 🚀 Deployment

This project is optimized for deployment on Vercel but can be hosted on any platform supporting Next.js applications.

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Log in to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Configuration

Ensure all environment variables are configured in your hosting platform:

- Firebase credentials (client and admin)
- OpenAI API keys
- Site configuration variables
- Content security settings

## 📈 10 Future Enhancements

<div align="center">
<table>
<tr>
<td>

### Implemented ✅

- [x] Light/dark theme toggle with system preference detection
- [x] Dynamic image optimization with Next.js Image component
- [x] Multi-provider AI integration (OpenAI and Anthropic)
- [x] Blog reaction system with analytics
- [x] User feedback collection and analysis
- [x] Interactive CV management system
- [x] Admin analytics dashboard

</td>
<td>

### Coming Soon 💫

- [ ] **Voice Search Integration**: Add speech recognition for hands-free navigation
- [ ] **Interactive Blog Playground**: Create interactive code examples in blog posts
- [ ] **Event Calendar**: Showcase speaking engagements and upcoming events
- [ ] **Mobile App Companion**: React Native app with offline reading capabilities
- [ ] **Expanded i18n Support**: Add more languages and localized content
- [ ] **AI-Generated Summaries**: Auto-summarize long blog posts
- [ ] **Content Recommendation Engine**: Suggest related content based on reading habits
- [ ] **Social Login Options**: Add GitHub, Google, and Twitter login integration
- [ ] **E-commerce Integration**: Sell digital products and merchandise
- [ ] **Interactive Tutorials**: Step-by-step guides with interactive elements

</td>
</tr>
</table>
</div>

---

<div align="center">
<img src="public/images/icons/logo.svg" alt="Logo" width="80" height="80" />

<h3>🌟 Thanks for exploring my personal website project! 🌟</h3>

<p>Feel free to use this as a starting point for your own website or contribute to the project.</p>

[![GitHub stars](https://img.shields.io/github/stars/patsteph/personal-website?style=social)](https://github.com/patsteph/personal-website/stargazers)
[![Follow](https://img.shields.io/twitter/follow/patsteph?style=social)](https://twitter.com/patsteph)

<p>
Made with ❤️ by Patrick Stephens<br>
<sub>Copyright © 2025 Patrick Stephens | MIT License</sub>
</p>
</div>