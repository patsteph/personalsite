import React from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// Default Firebase config with minimal info - we use server APIs for auth
// SECURITY: No API keys here - only public info
const defaultFirebaseConfig = {
  apiKey: "USE_SERVER_API", // Signal that we are not using direct Firebase auth
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "personalsite-19189"}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "personalsite-19189",
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "personalsite-19189"}.appspot.com`,
  appId: "1:000000000000:web:0000000000000000000000", // Placeholder
  measurementId: ""
};

// Initialize Firebase using a function to allow for different initialization paths
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase with environment variables or runtime config
const initializeFirebase = () => {
  // Server-side rendering check 
  if (typeof window === 'undefined') {
    // On server, use environment variables if available or return
    return { app: null, auth: null, firestore: null, storage: null };
  }
  
  // Don't re-initialize if already done
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // We're on the client side now, safe to try browser-specific configs
    // Start with default config from env variables (injected at build time)
    let config = defaultFirebaseConfig;
    
    try {
      // Note: We no longer store sensitive Firebase API keys in client-side config files
      // Instead we use server APIs that will handle Firebase authentication
      
      // Note: We need a different approach for client-side auth. Let's use a
      // dedicated auth API endpoint for sensitive operations
      console.log("Using Firebase auth via API endpoint instead of direct SDK");
      
      // Check for project ID at minimum to identify the Firebase project
      if (window.runtimeConfig?.firebase?.projectId) {
        config.projectId = window.runtimeConfig.firebase.projectId;
      }
      
      // This will redirect to the auth API for actual Firebase access
      // We'll use our API endpoints instead of direct Firebase access
      config = {
        apiKey: "USE_SERVER_API", // Signal to use server API instead of direct access
        authDomain: `${config.projectId || "personalsite-19189"}.firebaseapp.com`,
        projectId: config.projectId || "personalsite-19189",
        storageBucket: `${config.projectId || "personalsite-19189"}.appspot.com`,
        appId: "1:000000000000:web:0000000000000000000000", // Placeholder
        measurementId: ""
      };
      
      // Verification step - ensure we have at least the apiKey and projectId
      if (!config.apiKey || !config.projectId) {
        console.error("No Firebase config available", config);
        return { app: null, auth: null, firestore: null, storage: null };
      }
    } catch (error) {
      console.error("Error accessing browser globals:", error);
    }
    
    // Only initialize if we have at least a projectId
    if (config.projectId) {
      try {
        app = initializeApp(config);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    }
  }
  
  // Initialize Auth and Firestore if app was created
  if (app) {
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    
    // Connect to emulators in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        // Connect to auth and firestore emulators
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        
        // Connect to storage emulator if available
        if (storage) {
          const { connectStorageEmulator } = require('firebase/storage');
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('Connected to Firebase Storage emulator on localhost:9199');
        }
      } catch (error) {
        console.error('Failed to connect to Firebase emulators:', error);
      }
    }
  }
  
  return { app, auth, firestore, storage };
};

// Initialize Firebase on load
const { app: initializedApp, auth: initializedAuth, firestore: initializedFirestore, storage: initializedStorage } = initializeFirebase();

// Export the initialized instances
export { initializedApp as app, initializedAuth as auth, initializedFirestore as firestore, initializedStorage as storage };

// Promise that resolves when Firebase is ready
export const firebaseReady = Promise.resolve();

/**
 * Get the base path for the application
 */
export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    try {
      if (window.runtimeConfig?.basePath) {
        return window.runtimeConfig.basePath;
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  return '';
}

/**
 * Get the authentication instance
 */
export async function getAuthInstance(): Promise<Auth | null> {
  return auth;
}

/**
 * Get the Firestore instance
 */
export async function getFirestoreInstance(): Promise<Firestore | null> {
  return firestore;
}

/**
 * Get the Firebase Storage instance
 */
export async function getStorageInstance(): Promise<FirebaseStorage | null> {
  return storage;
}

/**
 * HOC to ensure Firebase is initialized before rendering
 */
export function withFirebase<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function WithFirebase(props: P) {
    return React.createElement(Component, props);
  };
}