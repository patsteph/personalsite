# Patrick Stephens - Personal Website

![Website Screenshot](public/images/headers/welcome.jpg)

A modern, responsive personal website built with Next.js, TypeScript, Tailwind CSS, and Firebase. This website showcases my professional experience, book collection, blog posts, and curated signals.

## ✨ Features

- **📱 Responsive Design**: Clean two-column layout that adapts beautifully to all devices
- **📚 Interactive Bookshelf**: Virtual bookshelf displaying my reading collection
- **✏️ Blog Platform**: Markdown-based blog with featured images and syntax highlighting
- **📄 CV/Resume Display**: Professional experience, skills, and education in an elegant format
- **📡 Signals**: Curated collection of newsletters and articles I recommend
- **🌐 Multi-language Support**: Content localization for English, Spanish, German, Japanese, and Ukrainian
- **🔒 Admin Interface**: Firebase authentication for content management
- **🚀 Optimized Build**: Static site generation with incremental regeneration

## 🛠️ Technology Stack

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

- **Next.js 15**: React framework for server-side rendering and static site generation
- **TypeScript**: Type safety and improved developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Firebase**: Authentication (client-side) and intended backend (Firestore) for API routes
- **MDX**: Enhanced Markdown for blog content with component support

## 🏛️ Architecture Overview

### API Pattern

The application utilizes Next.js API routes for data fetching and manipulation. Client components interact with these APIs via dedicated modules in `lib/api/`.

```mermaid
flowchart TD
    A[Client Component] --> B[API Client Module (lib/api/*)];
    B --> C[fetch()];
    C --> D[Next.js API Route (pages/api/*)];
    subgraph Server-Side
        D --> E{Process Request};
        E --> F[Backend Interaction (e.g., Firestore)];
        F --> G[Return Data/Status];
    end
    G --> C;
    C --> B;
    B --> A[Update UI];

    style Server-Side fill:#f9f,stroke:#333,stroke-width:2px
```

Key aspects:
- **Client Interaction**: UI components use functions from `lib/api/*` to request data or trigger actions.
- **API Routes**: Logic resides in `pages/api/*`. These routes handle requests, perform necessary operations (currently stubbed, intended to interact with Firestore or other backends), and return standardized JSON responses.
- **Data Fetching**: Server-side rendering (`getStaticProps`, `getServerSideProps`) also uses the `lib/api/*` modules to fetch data during build time or request time, requiring the `NEXT_PUBLIC_SITE_URL` environment variable to be set correctly for the build environment.
- **No Direct Backend Access**: Client components do not interact directly with backend services like Firestore; all interactions are proxied through the API routes.

### Authentication Flow

The website implements a multi-layered authentication approach:

```mermaid
graph TD
    A[User] -->|Access Admin Page| B[Edge Middleware]
    B -->|Check Auth Cookie| C{Cookie Valid?}
    C -->|No| D[Redirect to Login]
    C -->|Yes| E[Client-side Auth Check]
    E -->|Token Valid?| F[Render Admin UI]
    E -->|Invalid| D
    F -->|Make API Request| G[API Endpoint]
    G -->|Verify Firebase Token| H{Token Valid?}
    H -->|Yes| I[Perform Operation]
    H -->|No| J[Return 401 Unauthorized]
```

1. **Edge Middleware**: Protects admin routes at the network edge
2. **Client Protection**: ProtectedRoute component verifies authentication state
3. **Server Verification**: API routes independently verify Firebase tokens
4. **Automatic Session Management**: Token refresh and timeout handling

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

## 📁 Project Structure

```
personal-website/
├── components/            # React components
│   ├── admin/             # Admin interface components
│   ├── blog/              # Blog components
│   ├── books/             # Book components
│   ├── contact/           # Contact components
│   ├── cv/                # CV/Resume components
│   ├── layout/            # Layout components
│   ├── signals/           # Signals components
│   └── ui/                # Reusable UI components
├── content/               # Static content (blog posts, CV data)
├── lib/                   # Utility functions and services
│   ├── api/               # API client modules (used by components and server-side props)
│   ├── auth.tsx           # Authentication context and hooks (client-side)
│   ├── firebase.ts        # Firebase client initialization (primarily for Auth)
│   └── firebase-admin.ts  # Firebase Admin SDK initialization (intended for server-side API routes)
├── middleware.js          # Edge middleware for route protection
├── pages/                 # Next.js pages
│   ├── admin/             # Admin pages (protected)
│   ├── api/               # API routes
│   ├── blog/              # Blog pages
│   └── ...                # Other pages
├── public/                # Static assets
│   └── images/            # Image files
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## 🔌 Main Features Explained

### Virtual Bookshelf

The bookshelf feature displays books I'm reading with:
- Book cover displays in a card 
- ISBN lookup to automatically fetch book metadata
- Filterable by read status, genre, and my rating
- Full book details with my personal notes

### Blog Platform

The blog system utilizes:
- Markdown files (`content/blog`) for static post content.
- Next.js API routes (`pages/api/blog*`) for dynamic operations like fetching post lists, retrieving single posts, and potentially handling comments or reactions in the future (currently stubbed).
- MDX support allows embedding React components within blog content.
- Features include code syntax highlighting and reading time estimation.

### Signals

The signals feature curates newsletters and articles I recommend:
- Two content types: Newsletters and Articles
- Filterable by type, featured status, and tags
- Social media sharing
- Admin interface for content management

### Multi-language Support

The website supports multiple languages with:
- Internationalized routes
- Language selection in the footer
- Translation files for UI elements
- Content localization

## 🔐 Security Considerations

1. **Firebase Admin SDK Private Key**:
   - Stored securely as an environment variable
   - Never committed to the repository
   - Properly escaped with `\n` for newlines

2. **Protected Routes**:
   - Edge middleware provides first-layer protection
   - ProtectedRoute component enforces client-side authentication
   - API routes verify tokens server-side

3. **Session Management**:
   - Automatic timeout after 60 minutes of inactivity
   - Token refresh every 10 minutes
   - Activity monitoring to keep sessions alive

## 🚀 Deployment

This project is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel's dashboard
3. Deploy with the Next.js framework preset

For other hosting platforms, follow the standard Next.js deployment guidelines.

## 📋 Future Enhancements

- [X] Add light/dark theme toggle
- [X] Implement dynamic image optimization
- [ ] Add RSS feed for blog posts
- [ ] Create PWA support for offline access
- [X] Add commenting system to blog posts
- [X] Add Feedback system to site
- [X] Add Analytics to the admin dashboard

---

<p align="center">
  Made with ❤️ by Patrick Stephens
</p>