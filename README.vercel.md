# Deploying to Vercel

This document provides instructions for deploying this Next.js application to Vercel.

## Prerequisites

1. A Vercel account
2. The Vercel CLI installed (optional for UI deployments)
3. Firebase project credentials

## Environment Variables

The following environment variables need to be set in your Vercel project settings:

### Firebase Client (Required)

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Firebase Admin SDK (Required for API routes)

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----
```

**Important note about the private key:** The private key needs to have newlines properly escaped with `\n`. When copying from the Firebase console JSON file, it may already have escaped newlines.

### Other Environment Variables

```
NEXT_PUBLIC_CONTACT_EMAIL=your-email@example.com
GOOGLE_BOOKS_API_KEY=your-google-books-api-key (optional)
```

## Deployment Steps

### Using the Vercel Dashboard

1. Log in to your Vercel account
2. Create a new project by importing your GitHub repository
3. Configure the project:
   - Set the framework preset to Next.js
   - Add all the environment variables listed above
   - Choose your preferred deploy settings (production branch, etc.)
4. Click Deploy

### Using the Vercel CLI

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project directory and deploy:
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. Follow the interactive prompts to configure your project
5. Set up environment variables when prompted, or add them later in the Vercel dashboard

## Troubleshooting

If you encounter issues during deployment, check the following:

1. **Build errors:**
   - Check the build logs in the Vercel dashboard
   - Ensure all required environment variables are set correctly
   - Verify your Node.js version is compatible (this project requires Node.js 18+)

2. **Firebase Admin SDK errors:**
   - Ensure the `FIREBASE_PRIVATE_KEY` is correctly formatted with escaped newlines
   - Verify the service account has the correct permissions

3. **API route errors:**
   - Check that the Firebase Admin SDK is initialized correctly
   - Verify that API endpoints are working as expected by testing them

## Post-Deployment

After successful deployment:

1. Update your DNS settings if you want to use a custom domain
2. Test all functionality, especially the admin section and API routes
3. Set up preview deployments for future pull requests

For more help, refer to the [Vercel documentation](https://vercel.com/docs) or [contact Vercel support](https://vercel.com/support).