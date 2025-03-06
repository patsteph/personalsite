# Modern Personal Website with Next.js and Firebase

A sophisticated personal website built with Next.js, TypeScript, Tailwind CSS, and Firebase, featuring a virtual bookshelf, blog platform, CV showcase, and multi-language support.

![Project Preview](project-preview.jpg)

## ✨ Features

- **🏗️ Responsive Two-Column Design**: Clean 25%/75% split layout that adapts beautifully to any device
- **📚 Virtual Bookshelf**: Interactive bookshelf with books displayed by spine that can be sorted and filtered
- **✏️ Blog Platform**: Markdown-based blog with featured image support and syntax highlighting
- **📄 CV/Resume Section**: Elegant display of professional experience, skills, and education
- **🌐 Multi-language Support**: Content localization for English, Spanish, German, Japanese, and Ukrainian
- **🔒 Secure Admin Interface**: Firebase authentication for managing book collection
- **🚀 Optimized Performance**: Static site generation with incremental static regeneration

## 🛠️ Technology Stack

- **Next.js**: React framework for static site generation and server-side rendering
- **TypeScript**: Type safety and improved developer experience
- **Tailwind CSS**: Utility-first styling for rapid development
- **Firebase**: Authentication and Firestore database for dynamic content
- **MDX**: Enhanced Markdown for blog content

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
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

4. **Set up environment variables**
   - Copy the `.env.local.example` file to `.env.local`
   - Fill in your Firebase configuration details

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
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
├── pages/                 # Next.js pages
│   ├── admin/             # Admin pages
│   ├── blog/              # Blog pages
│   ├── api/               # API routes
│   └── ...                # Other pages
├── public/                # Static assets
│   ├── images/            # Images
│   └── files/             # Downloadable files
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## 🌐 Deploying to GitHub Pages

Next.js can be deployed to GitHub Pages with a static export. Here's how to set it up:

1. **Update the `next.config.js` file**
   - Update the `basePath` and `assetPrefix` with your repository name
   - Make sure `trailingSlash` is set to `true`

   ```js
   const nextConfig = {
     // ...
     basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
     assetPrefix: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '',
     trailingSlash: true,
   }
   ```

2. **Create a GitHub repository**
   - Create a new repository named `your-username.github.io` for a user site, or `any-name` for a project site

3. **Update your `package.json` with a deploy script**

   ```json
   "scripts": {
     // ...
     "export": "next build && next export",
     "deploy": "npm run export && touch out/.nojekyll && gh-pages -d out"
   }
   ```

4. **Install the GitHub Pages deployment package**

   ```bash
   npm install --save-dev gh-pages
   # or
   yarn add --dev gh-pages
   ```

5. **Build and deploy your site**

   ```bash
   npm run deploy
   # or
   yarn deploy
   ```

6. **Configure GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set the source to the `gh-pages` branch
   - Save the changes

7. **Your site should now be live at `https://your-username.github.io` or `https://your-username.github.io/your-repo-name`**

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

## 🔧 Customization

### Styling

The site uses Tailwind CSS for styling. Customize the theme colors in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'linen': '#FAF0E6',
        'steel-blue': '#4682B4',
        'accent': '#2a4d69',
        'light-accent': '#d6e1e8',
      },
      // ...
    },
  },
  // ...
}
```

### Translations

Add or update translations in the `lib/translations.ts` file:

```typescript
const commonTranslations: TranslationSet = {
  en: {
    'nav.welcome': 'Welcome',
    // ...
  },
  es: {
    'nav.welcome': 'Bienvenido',
    // ...
  },
  // ...
}
```

### Personal Information

Update your personal information in the corresponding page files:

- Basic info: `components/layout/Sidebar.tsx`
- Contact info: `pages/contact.tsx`
- Social links: Various components

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ by "Your Name"
</p>