import React from 'react';

// This file is now a placeholder that provides information about the project
// No actual Firebase SDK is used client-side for security
// All Firebase operations are performed via server API endpoints

// Project information for reference only
const projectInfo = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'personalsite-19189',
  region: 'us-central1'
};

// Export empty placeholder for compatibility with existing code
export const auth = null;
export const firestore = null;
export const storage = null;
export const app = null;
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
 * Get project ID
 */
export function getProjectId(): string {
  return projectInfo.projectId;
}

/**
 * HOC to ensure Firebase is initialized before rendering
 * Now just passes through since we don't use Firebase client-side
 */
export function withFirebase<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function WithFirebase(props: P) {
    return React.createElement(Component, props);
  };
}