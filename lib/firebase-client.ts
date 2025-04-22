// lib/firebase-client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence, browserSessionPersistence } from 'firebase/auth';

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
let authInstance = null;
let dbInstance = null;

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app); // Initialize Firestore
  
  // Initialize Auth and set persistence
  try {
    authInstance = getAuth(app);
    // Use browserLocalPersistence for persistent sessions (like localStorage)
    // Use browserSessionPersistence for session-only (cleared on browser close)
    // Use inMemoryPersistence for no persistence (cleared on page refresh)
    setPersistence(authInstance, browserLocalPersistence)
      .then(() => {
        console.log('Firebase Auth persistence set to local.');
      })
      .catch((error) => {
        console.error('Firebase Auth: Error setting persistence:', error);
      });
  } catch (error) {
    console.error('Firebase Auth initialization error:', error);
    authInstance = null; // Ensure auth is null if init fails
  }

} else {
  console.error(
    'Firebase client config is missing. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set.'
  );
}

const db = dbInstance; // Assign potentially initialized db
const auth = authInstance; // Assign potentially initialized auth

export { app, db, auth }; // Export the initialized app, Firestore instance, and auth instance
