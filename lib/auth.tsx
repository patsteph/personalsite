import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth } from './firebase';
import * as authApi from './api/auth';

// Constants for auth timeouts
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour of inactivity

// Define the authentication context type
type AuthContextType = {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
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
      return await authApi.getCurrentUserToken(true);
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

  // Listen for auth state changes
  useEffect(() => {
    // Check if auth is initialized
    if (!auth) {
      console.warn('Firebase Auth not initialized');
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth as Auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Reset activity timestamp when user logs in
        updateLastActivity();
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [updateLastActivity]);

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

  // Function to sign in
  const signIn = async (email: string, password: string, _rememberMe = true): Promise<void> => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Use the auth API to sign in
      const userCredential = await authApi.signInWithEmailAndPassword(email, password);
      setUser(userCredential.user);
      setIsAuthenticated(true);
      
      // Reset activity timestamp
      updateLastActivity();
      
      // Store auth success in sessionStorage for alternative pages
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_success', 'true');
        sessionStorage.setItem('auth_timestamp', new Date().toISOString());
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error instanceof Error ? error : new Error('Authentication failed'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to sign out
  const signOut = async (): Promise<void> => {
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
      
      // Use the auth API to sign out
      await authApi.signOut();
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear auth data from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_success');
        sessionStorage.removeItem('auth_timestamp');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error instanceof Error ? error : new Error('Sign out failed'));
    } finally {
      setLoading(false);
    }
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