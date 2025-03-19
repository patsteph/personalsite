# Modern Personal Website with Next.js and Firebase

A sophisticated personal website built with Next.js, TypeScript, Tailwind CSS, and Firebase, featuring a virtual bookshelf, blog platform, CV showcase, and multi-language support.

## ✨ Features

- **🏗️ Responsive Two-Column Design**: Clean 25%/75% split layout that adapts beautifully to any device
- **📚 Virtual Bookshelf**: Interactive bookshelf with books displayed by spine that can be sorted and filtered
- **✏️ Blog Platform**: Markdown-based blog with featured image support and syntax highlighting
- **📄 CV/Resume Section**: Elegant display of professional experience, skills, and education
- **🌐 Multi-language Support**: Content localization for English, Spanish, German, Japanese, and Ukrainian
- **🔒 Secure Admin Interface**: Firebase authentication for managing book collection and blog posts
- **🚀 Optimized Performance**: Static site generation with incremental static regeneration
- **🔥 Server-side API**: Next.js API routes with Firebase Admin SDK

## 🛠️ Technology Stack

- **Next.js**: React framework for static site generation and server-side rendering
- **TypeScript**: Type safety and improved developer experience
- **Tailwind CSS**: Utility-first styling for rapid development
- **Firebase**: Authentication and Firestore database for dynamic content
- **MDX**: Enhanced Markdown for blog content

## 📋 Architecture Overview

### Authentication Flow

The authentication system uses a multi-layered approach:

1. **Edge Middleware**: Protects admin routes at the edge (middleware.js)
2. **Client-side Protection**: ProtectedRoute component verifies authentication
3. **Server-side Verification**: API routes verify Firebase tokens
4. **Session Management**: Tracks user activity and refreshes tokens
5. **Automatic Timeout**: Logs out inactive users after 60 minutes

### API Pattern

The application uses a "server-first, client-fallback" pattern:

1. Server-side API routes in `/pages/api/` provide secure operations
2. Client-side API modules in `/lib/api/` call server endpoints first
3. If server endpoints fail, the system falls back to direct Firebase access
4. Graceful degradation ensures functionality across environments

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/personal-website.git
   cd personal-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Add a web app to your project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Generate a Firebase Admin SDK private key for server-side operations:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the JSON file securely

4. **Set up environment variables**
   - Copy the `.env.local.example` file to `.env.local`
   - Fill in your Firebase configuration details

   ```
   # Firebase Configuration (Client-side)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Firebase Admin SDK (Server-side)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----

   # Contact Info
   NEXT_PUBLIC_CONTACT_EMAIL=your-email@example.com

   # Base Path - empty for standard hosting
   NEXT_PUBLIC_BASE_PATH=
   ```

5. **Create an admin user in Firebase**
   - Go to Authentication in Firebase Console
   - Click on "Add user"
   - Enter email and password
   - Save these credentials to log in to the admin dashboard

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000) to see your website**

## 📦 Project Structure

```
personal-website/
├── components/            # React components
│   ├── AppProviders.tsx   # Global providers (Auth, Translations)
│   ├── ProtectedRoute.tsx # Route protection wrapper
│   ├── admin/             # Admin interface components
│   ├── blog/              # Blog-related components
│   ├── books/             # Book-related components
│   ├── contact/           # Contact page components
│   ├── cv/                # CV/Resume components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── content/               # Static content
│   ├── blog/              # Blog posts (Markdown)
│   └── cv/                # CV data (JSON)
├── lib/                   # Utility functions and services
│   ├── api/               # API client modules
│   │   ├── auth.ts        # Authentication API
│   │   ├── blog.ts        # Blog API
│   │   ├── books.ts       # Books API
│   │   └── index.ts       # API exports
│   ├── auth.tsx           # Authentication context
│   ├── blog.ts            # Blog compatibility layer
│   ├── books.ts           # Books compatibility layer
│   ├── config.ts          # App configuration
│   ├── firebase.ts        # Firebase client initialization
│   ├── firebase-admin.ts  # Firebase Admin SDK
│   └── translations.tsx   # i18n functionality
├── middleware.js          # Edge middleware for route protection
├── pages/                 # Next.js pages
│   ├── _app.tsx           # App entry with providers
│   ├── _document.tsx      # Custom document component
│   ├── admin/             # Admin pages (protected)
│   ├── blog/              # Blog pages
│   ├── api/               # API routes
│   │   ├── auth.ts        # Authentication API
│   │   ├── blog.ts        # Blog API
│   │   └── books.ts       # Books API
│   └── ...                # Other pages
├── public/                # Static assets
│   ├── images/            # Images
│   └── runtime-config.js  # Runtime configuration
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## 🌐 Deployment Options

### Vercel Deployment (Recommended)

This project is optimized for deployment on Vercel:

1. **Set up your environment variables in Vercel**:
   - Copy all variables from your `.env.local` file to Vercel's environment variables
   - Make sure to properly escape the Firebase private key
   - Leave `NEXT_PUBLIC_BASE_PATH` empty

2. **Deploy using Vercel CLI or GitHub integration**:
   
   **Using Vercel Dashboard:**
   - Connect your GitHub repository to Vercel
   - Configure the framework preset to Next.js
   - Add all environment variables
   - Deploy

   **Using Vercel CLI:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   
   # For production deployment
   vercel --prod
   ```

3. **Post-Deployment Steps**:
   - Set up custom domain if needed
   - Verify all functionality works in production
   - Test the authentication system
   - Verify API routes are working correctly
   - Check book and blog management

### Netlify or Other Next.js-Compatible Hosting

The setup is similar to Vercel with these differences:

1. **Environment Variables**:
   - Set up environment variables in your hosting platform
   - Ensure Firebase private key has newlines correctly escaped

2. **Build Commands**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Node.js Version**:
   - Ensure your hosting environment uses Node.js 18+

## 📝 Adding Content

### Blog Posts

Add blog posts as Markdown files in the `content/blog` directory using the following format:

```markdown
---
title: "Your Blog Post Title"
date: "2025-03-01"
summary: "A brief summary of your blog post"
---

Your blog post content goes here.

## Heading 2

### Heading 3

And so on...
```

### CV Data

Update your CV information in the `content/cv/cv-data.json` file:

```json
{
  "about": "Your about text",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "period": "2020 - Present",
      "description": "Job description"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "location": "Location",
      "year": "2015"
    }
  ]
}
```

### Books

Books are managed through the admin interface. To add a book:

1. Log in to the admin interface at `/admin`
2. Navigate to "Book Management"
3. Click "Add New Book"
4. Enter the ISBN of the book and click "Lookup"
5. Add your reading status and notes
6. Click "Add to Collection"

## 📄 Security Considerations

1. **Firebase Admin SDK Private Key**:
   - Store this securely as an environment variable
   - Never commit it to your repository
   - Ensure it's properly escaped with `\n` for newlines

2. **Protected Routes**:
   - Edge middleware provides first-layer protection
   - ProtectedRoute component enforces client-side authentication
   - API routes verify tokens server-side

3. **Session Management**:
   - Automatic timeout after 60 minutes of inactivity
   - Token refresh every 10 minutes
   - Activity monitoring to keep sessions alive

4. **Firebase Rules**:
   - Set up proper Firestore security rules for your collections

## 🔧 Troubleshooting

### Deployment Issues

1. **Firebase Admin SDK errors**:
   - Check that `FIREBASE_PRIVATE_KEY` is correctly formatted with escaped newlines
   - Verify the service account has the correct permissions

2. **API route errors**:
   - Check that the Firebase Admin SDK is initialized correctly
   - Verify that API endpoints return proper status codes
   - Check browser console for client-side errors

3. **Authentication issues**:
   - Verify Firebase configuration is correct
   - Check that the admin user exists in Firebase Authentication
   - Make sure cookies and localStorage are enabled

## 🔧 GitHub to Standard Hosting Migration

If you previously deployed on GitHub Pages:

1. **Remove GitHub Pages specific settings**:
   - Update `next.config.js` to remove `basePath` and `assetPrefix`
   - Set `NEXT_PUBLIC_BASE_PATH` to an empty string
   - Update any hardcoded '/personalsite' references

2. **Add Server-side Functionality**:
   - Ensure Firebase Admin SDK is properly configured
   - Test API routes are functioning correctly
   - Set up environment variables in your hosting platform

---

<p align="center">
  Made with ❤️ by [Your Name]
</p>