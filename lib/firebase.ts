import React from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase using a function to allow for different initialization paths
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

// Initialize Firebase with environment variables or runtime config
const initializeFirebase = () => {
  // Server-side rendering check 
  if (typeof window === 'undefined') {
    // On server, use environment variables if available or return
    console.log("Server-side rendering detected, skipping Firebase initialization");
    return { app: null, auth: null, firestore: null };
  }
  
  // Don't re-initialize if already done
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // We're on the client side now, safe to try browser-specific configs
    // Start with the basic config from environment
    let config = firebaseConfig;
    
    try {
      // Try SECURE_CONFIG first
      if (window.SECURE_CONFIG?.firebase?.apiKey) {
        console.log("Using Firebase config from SECURE_CONFIG");
        config = {
          apiKey: window.SECURE_CONFIG.firebase.apiKey,
          authDomain: window.SECURE_CONFIG.firebase.authDomain,
          projectId: window.SECURE_CONFIG.firebase.projectId,
          storageBucket: window.SECURE_CONFIG.firebase.storageBucket,
          messagingSenderId: window.SECURE_CONFIG.firebase.messagingSenderId,
          appId: window.SECURE_CONFIG.firebase.appId,
          measurementId: window.SECURE_CONFIG.firebase.measurementId
        };
      } 
      // Then try runtimeConfig
      else if (window.runtimeConfig?.firebase?.apiKey) {
        console.log("Using Firebase config from runtimeConfig");
        config = {
          apiKey: window.runtimeConfig.firebase.apiKey || "",
          authDomain: window.runtimeConfig.firebase.authDomain || "",
          projectId: window.runtimeConfig.firebase.projectId || "",
          storageBucket: window.runtimeConfig.firebase.storageBucket || "",
          messagingSenderId: window.runtimeConfig.firebase.messagingSenderId || "",
          appId: window.runtimeConfig.firebase.appId || "",
          measurementId: window.runtimeConfig.firebase.measurementId
        };
      }
      
      // Log warning if no configuration is available
      if (!config.apiKey) {
        console.warn("No Firebase config available from environment or runtime configuration");
        // Return without initializing Firebase when no config is available
        return { app: null, auth: null, firestore: null };
      }
      
      // Log what we're using
      console.log("Firebase initialization with projectId:", config.projectId || "unknown");
    } catch (error) {
      console.error("Error accessing browser globals:", error);
    }
    
    // Only initialize if we have at least a projectId
    if (config.projectId) {
      try {
        app = initializeApp(config);
        console.log("Firebase initialized successfully");
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    } else {
      console.warn("Missing Firebase config, not initializing Firebase");
    }
  }
  
  // Initialize Auth and Firestore if app was created
  if (app) {
    auth = getAuth(app);
    firestore = getFirestore(app);
    
    // Connect to emulators in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      } catch (error) {
        console.error('Failed to connect to Firebase emulators:', error);
      }
    }
  }
  
  return { app, auth, firestore };
};

// Initialize Firebase on load
const { app: initializedApp, auth: initializedAuth, firestore: initializedFirestore } = initializeFirebase();

// Export the initialized instances
export { initializedApp as app, initializedAuth as auth, initializedFirestore as firestore };

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
      console.warn('Error accessing runtimeConfig:', error);
    }
  }
  
  return '';
}

/**
 * Get the authentication instance
 */
export async function getAuthInstance(): Promise<Auth | null> {
  if (!auth) {
    console.warn('Firebase Auth is not initialized');
  }
  return auth;
}

/**
 * Get the Firestore instance
 */
export async function getFirestoreInstance(): Promise<Firestore | null> {
  if (!firestore) {
    console.warn('Firestore is not initialized');
  }
  return firestore;
}

/**
 * HOC to ensure Firebase is initialized before rendering
 */
export function withFirebase<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function WithFirebase(props: P) {
    return React.createElement(Component, props);
  };
}