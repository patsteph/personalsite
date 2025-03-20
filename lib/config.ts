// Base path for the application
export const basePath = '';

// Firebase configuration - using environment variables only for better security
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Application settings
export const appConfig = {
  title: 'Personal Website',
  description: 'A personal website with blog, CV, and books',
  author: 'Patrick Stephenson',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  defaultLocale: 'en',
};

// Social media links
export const socialLinks = {
  github: 'https://github.com/patsteph',
  twitter: 'https://twitter.com/example',
  linkedin: 'https://linkedin.com/in/example',
};

// Runtime configuration helper
export const getRuntimeConfig = () => {
  // For client-side, use window.runtimeConfig
  if (typeof window !== 'undefined') {
    try {
      if (window.runtimeConfig) {
        return window.runtimeConfig;
      }
    } catch (error) {
      console.warn('Error accessing window.runtimeConfig:', error);
    }
  }
  
  // Default fallback configuration
  return {
    basePath,
    firebase: firebaseConfig,
    isProduction: process.env.NODE_ENV === 'production'
  };
};