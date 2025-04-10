/**
 * Authentication API module
 * 
 * This module handles authentication via server-side endpoints
 * No Firebase client SDK usage or API keys in client code
 */

// Define our own user interface instead of using Firebase types
export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

// Define our own credential interface
export interface AuthCredential {
  user: AppUser;
  token: string;
}

// Define interface for signIn response from server
interface SignInResponse {
  success: boolean;
  token?: string;
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
  error?: string;
}

/**
 * Sign in user with email and password using server API
 */
export async function signInWithEmailAndPassword(
  email: string, 
  password: string
): Promise<AuthCredential> {
  try {
    // Call our server API for authentication
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Authentication failed');
    }
    
    const data = await response.json() as SignInResponse;
    
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    // Store token in localStorage for API requests
    localStorage.setItem('authToken', data.token);
    
    // Return our simplified credential
    return {
      user: {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        photoURL: data.user.photoURL
      },
      token: data.token
    };
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
    // Clear token from localStorage
    localStorage.removeItem('authToken');
    
    // Optionally call server to invalidate session
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

/**
 * Get the current auth token
 */
export async function getCurrentUserToken(forceRefresh = false): Promise<string | null> {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return null;
    }
    
    // If forced refresh is requested, validate token with server
    if (forceRefresh) {
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          localStorage.removeItem('authToken');
          return null;
        }
        
        const data = await response.json();
        if (!data.valid) {
          localStorage.removeItem('authToken');
          return null;
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error('API: Error getting token:', error);
    return null;
  }
}

/**
 * Get the current user from token
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const token = await getCurrentUserToken();
  
  if (!token) {
    return null;
  }
  
  try {
    // Get user profile from server
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}