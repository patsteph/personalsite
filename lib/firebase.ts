import React from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// Default empty Firebase config for type safety
const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
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
    // Start with empty default config
    let config = defaultFirebaseConfig;
    
    try {
      // Try SECURE_CONFIG first
      if (window.SECURE_CONFIG?.firebase?.apiKey) {
        config = {
          apiKey: window.SECURE_CONFIG.firebase.apiKey || "",
          authDomain: window.SECURE_CONFIG.firebase.authDomain || "",
          projectId: window.SECURE_CONFIG.firebase.projectId || "",
          storageBucket: window.SECURE_CONFIG.firebase.storageBucket || "",
          messagingSenderId: window.SECURE_CONFIG.firebase.messagingSenderId || "",
          appId: window.SECURE_CONFIG.firebase.appId || "",
          measurementId: window.SECURE_CONFIG.firebase.measurementId || ""
        };
      } 
      // Then try runtimeConfig
      else if (window.runtimeConfig?.firebase?.apiKey) {
        config = {
          apiKey: window.runtimeConfig.firebase.apiKey || "",
          authDomain: window.runtimeConfig.firebase.authDomain || "",
          projectId: window.runtimeConfig.firebase.projectId || "",
          storageBucket: window.runtimeConfig.firebase.storageBucket || "",
          messagingSenderId: window.runtimeConfig.firebase.messagingSenderId || "",
          appId: window.runtimeConfig.firebase.appId || "",
          measurementId: window.runtimeConfig.firebase.measurementId || ""
        };
      }
      
      // Return if no configuration is available
      if (!config.apiKey) {
        // Return without initializing Firebase when no config is available
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