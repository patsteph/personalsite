import React from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// Default Firebase config from environment variables (at build time)
const defaultFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
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
      // Prioritize runtime config from the browser
      if (window.runtimeConfig?.firebase?.apiKey) {
        // Log the found configuration (for debugging)
        console.log("Using Firebase config from runtime-config.js");
        
        config = {
          apiKey: window.runtimeConfig.firebase.apiKey || "",
          authDomain: window.runtimeConfig.firebase.authDomain || "",
          projectId: window.runtimeConfig.firebase.projectId || "",
          storageBucket: window.runtimeConfig.firebase.storageBucket || "",
          messagingSenderId: window.runtimeConfig.firebase.messagingSenderId || "",
          appId: window.runtimeConfig.firebase.appId || "",
          measurementId: window.runtimeConfig.firebase.measurementId || ""
        };
      } else {
        // Also try SECURE_CONFIG as a fallback
        if (window.SECURE_CONFIG?.firebase?.apiKey) {
          console.log("Using Firebase config from secure-config.js");
          
          config = {
            apiKey: window.SECURE_CONFIG.firebase.apiKey || "",
            authDomain: window.SECURE_CONFIG.firebase.authDomain || "",
            projectId: window.SECURE_CONFIG.firebase.projectId || "",
            storageBucket: window.SECURE_CONFIG.firebase.storageBucket || "",
            messagingSenderId: window.SECURE_CONFIG.firebase.messagingSenderId || "",
            appId: window.SECURE_CONFIG.firebase.appId || "",
            measurementId: window.SECURE_CONFIG.firebase.measurementId || ""
          };
        } else {
          console.log("Using default Firebase config from environment variables");
        }
      }
      
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