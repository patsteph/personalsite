/**
 * Authentication API module
 * 
 * This module handles authentication via Firebase Client SDK
 */

// Import Firebase client auth instance and SDK method
import { auth } from '../firebase-client';
import { 
  signInWithEmailAndPassword as firebaseSignIn, 
  UserCredential, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

// Define our own user interface instead of using Firebase types
export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Sign in user with email and password using Firebase Client SDK
 */
export async function signIn(
  email: string, 
  password: string
): Promise<UserCredential> {
  try {
    // Call Firebase Client SDK authentication
    if (!auth) {
      throw new Error('Firebase auth instance is not initialized.');
    }
    console.log('Client API (signInWithEmailAndPassword): Calling Firebase SDK signIn...');
    const userCredential = await firebaseSignIn(auth, email, password);
    console.log('Client API (signInWithEmailAndPassword): Firebase SDK signIn successful. UID:', userCredential.user.uid);
    // No need to store token in localStorage, SDK manages session
    return userCredential;
  } catch (error) {
    console.error('Client API: Firebase SDK Authentication error:', error);
    // Rethrow the error so the calling component can handle it
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    // Clear token from localStorage (if any remnants)
    localStorage.removeItem('authToken');
    
    // Sign out from Firebase SDK (handled in AuthProvider now, but can keep here for safety)
    // if (auth) {
    //   await firebaseSignOut(auth);
    // }

    // Optionally call server to invalidate session (if backend session exists)
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.warn('Failed to notify server about signout', error);
    }
  } catch (error) {
    console.error('API: Sign out error:', error);
    throw error;
  }
}