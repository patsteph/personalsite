import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { getCurrentUserToken, signInWithEmailAndPassword as apiSignIn, AppUser } from './api/auth';
import { auth } from '@/lib/firebase-client';
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Constants for auth timeouts
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour of inactivity

// Define the authentication context type
type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  authError: Error | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  resetAuthError: () => void;
  recheckAuthState: () => Promise<boolean>;
};

// Create a default context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshToken: async () => null,
  resetAuthError: () => {},
  recheckAuthState: async () => false
});

// Export the context
export { AuthContext };

// Define props for the AuthProvider component
type AuthProviderProps = {
  children: ReactNode;
};

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// The AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Refs for tracking activity and intervals
  const lastActivityRef = useRef(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Auto sign out after inactivity
  const checkInactivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > SESSION_TIMEOUT && isAuthenticated) {
      console.log('Session timeout due to inactivity');
      signOut();
    }
  }, [isAuthenticated]);

  // Function to refresh token
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      updateLastActivity();
      
      // If token is in localStorage, try to validate it first
      const currentToken = localStorage.getItem('authToken');
      if (currentToken) {
        try {
          // Attempt to validate the existing token
          const response = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.valid) {
              return currentToken;
            }
          }
        } catch (validateError) {
          console.warn('Error validating current token:', validateError);
        }
      }
      
      // If we reach here, either there was no token or it was invalid
      return await getCurrentUserToken(true);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }, [user, updateLastActivity]);

  // Set up token refresh and activity monitoring
  useEffect(() => {
    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });
    
    // Start periodic checks for token refresh and session timeout
    if (isAuthenticated) {
      // Set up token refresh interval
      refreshIntervalRef.current = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
      
      // Set up session timeout checker
      sessionTimeoutRef.current = setInterval(checkInactivity, 60000); // Check every minute
    }
    
    // Clean up on unmount
    return () => {
      // Remove event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateLastActivity);
      });
      
      // Clear intervals
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
    };
  }, [isAuthenticated, refreshToken, updateLastActivity, checkInactivity]);

  // Function to sign in
  const signIn = async (email: string, password: string): Promise<void> => {
    // Check if auth is initialized
    if (!auth) {
        const error = new Error("Firebase Auth is not initialized. Check firebase-client.ts and environment variables.");
        console.error(error.message);
        setAuthError(error);
        throw error;
    }
    
    try {
      setLoading(true);
      setAuthError(null);

      // --- Use server-side API for authentication ---
      console.log(`Attempting API sign-in for: ${email}`);
      const credential = await apiSignIn(email, password);
      const appUser: AppUser = credential.user;
      const token = credential.token;
      console.log('API client sign-in successful:', appUser.uid);
      setUser(appUser);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
      }

      // Reset activity timestamp
      updateLastActivity();

      // Store auth success state timestamp
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_timestamp', new Date().toISOString());
        console.log('Auth success state saved to session');
      }

    } catch (error: any) {
      console.error('API client sign-in error:', error);
      // Provide more specific error messages if possible
      let errorMessage = 'Authentication failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.'
      } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection and try again.'
      }
      setAuthError(new Error(errorMessage));
      throw new Error(errorMessage); // Re-throw formatted error for LoginForm
    } finally {
      setLoading(false);
    }
  };

  // --- Update signOut to use firebaseSignOut ---
  const signOut = async (): Promise<void> => {
     if (!auth) {
        console.error("Firebase Auth is not initialized. Cannot sign out.");
        // Optionally set an error state
        return;
    }
    try {
      setLoading(true);
      
      // Clear intervals
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      await firebaseSignOut(auth); // <-- Use Firebase sign out
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear auth data from sessionStorage, localStorage and cookies
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.removeItem('auth_timestamp');
        
        // Clear localStorage
        localStorage.removeItem('authToken');
        
        console.log('Auth state cleared from session, localStorage, and cookies');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error instanceof Error ? error : new Error('Sign out failed'));
    } finally {
      setLoading(false);
    }
  };

  // --- Update onAuthStateChanged listener ---
  useEffect(() => {
      if (!auth) {
          console.warn("Firebase Auth not initialized. Skipping auth state listener.");
          setLoading(false);
          return;
      }
      console.log("Setting up onAuthStateChanged listener...");
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          console.log(`>>> onAuthStateChanged triggered. Firebase user: ${firebaseUser ? firebaseUser.uid : 'null'}`);
          if (firebaseUser) {
              console.log("onAuthStateChanged: User is signed in:", firebaseUser.uid);
              const appUser: AppUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || undefined,
                  displayName: firebaseUser.displayName || undefined,
                  photoURL: firebaseUser.photoURL || undefined,
              };
              setUser(appUser);
              setIsAuthenticated(true);
          } else {
              console.log("onAuthStateChanged: User is signed out");
              setUser(null);
              setIsAuthenticated(false);
          }
          setLoading(false);
      });
      // Cleanup listener on unmount
      return () => {
        console.log("Cleaning up onAuthStateChanged listener.");
        unsubscribe();
      };
  }, [auth]); // Add auth as dependency

  // Function to reset auth error
  const resetAuthError = () => {
    setAuthError(null);
  };

  // Function to recheck auth state
  const recheckAuthState = async (): Promise<boolean> => {
    if (user) {
      try {
        // Try to refresh the token to verify auth state is still valid
        const token = await refreshToken();
        return !!token;
      } catch (error) {
        console.error('Auth state check failed:', error);
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        authError,
        signIn,
        signOut,
        refreshToken,
        resetAuthError,
        recheckAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}