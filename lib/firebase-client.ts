// lib/firebase-client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Import other Firebase services like getStorage if needed

// Your web app's Firebase configuration from the Firebase console
// Store these in environment variables (.env.local) for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase only if it hasn't been initialized yet
// Check required config values before initializing
let app;
if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
  console.error(
    'Firebase client config is missing. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set.'
  );
  // You might want to handle this more gracefully, maybe throw an error
  // or provide a dummy app object if appropriate for your use case.
}

const db = app ? getFirestore(app) : null; // Get Firestore instance only if app is initialized
const auth = app ? getAuth(app) : null; // Initialize auth instance only if app is initialized
// Export other services like storage if initialized

export { app, db, auth }; // Export the initialized app, Firestore instance, and auth instance
