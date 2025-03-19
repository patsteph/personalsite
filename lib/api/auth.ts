/**
 * Authentication API module
 * 
 * This module handles all authentication-related interactions with Firebase
 */
import {
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  getIdToken,
  UserCredential,
  User,
  Auth
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Sign in user with email and password
 */
export async function signInWithEmailAndPassword(
  email: string, 
  password: string
): Promise<UserCredential> {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    return await firebaseSignIn(auth as Auth, email, password);
  } catch (error) {
    console.error('API: Authentication error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    if (!auth) {
      console.warn('Firebase Auth is not initialized, no need to sign out');
      return;
    }
    return await firebaseSignOut(auth as Auth);
  } catch (error) {
    console.error('API: Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current user's ID token
 */
export async function getCurrentUserToken(forceRefresh = false): Promise<string | null> {
  try {
    if (!auth) {
      console.warn('Firebase Auth is not initialized');
      return null;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    return await getIdToken(currentUser, forceRefresh);
  } catch (error) {
    console.error('API: Error getting token:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    console.warn('Firebase Auth is not initialized');
    return null;
  }
  return auth.currentUser;
}