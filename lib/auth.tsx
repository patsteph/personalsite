import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { getCurrentUserToken, signInWithEmailAndPassword as apiSignIn, signOut as apiSignOut, getCurrentUser, AppUser } from './api/auth';

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

  // Initialize auth state on mount
  useEffect(() => {
    (async () => {
      console.log('AuthProvider: Initializing auth state...');
      setLoading(true);
      try {
        const token = await getCurrentUserToken();
        console.log('AuthProvider: Token retrieved:', token ? `Token found (length ${token.length})` : 'No token found');
        if (token) {
          console.log('AuthProvider: Calling getCurrentUser...');
          const currentUser = await getCurrentUser(); // This calls the client-side function in lib/api/auth.ts
          console.log('AuthProvider: getCurrentUser result:', currentUser);
          if (currentUser) {
            console.log('AuthProvider: User authenticated successfully.', currentUser);
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            console.log('AuthProvider: getCurrentUser returned null/falsy. Setting unauthenticated.');
            setIsAuthenticated(false);
          }
        } else {
          console.log('AuthProvider: No initial token found. Setting unauthenticated.');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error during initialization:', error);
        setIsAuthenticated(false); // Ensure unauthenticated on error
      }
      setLoading(false);
      console.log('AuthProvider: Initialization complete.');
    })();
  }, []);

  // Function to sign in
  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    try {
      const credential = await apiSignIn(email, password);
      setUser(credential.user);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') localStorage.setItem('authToken', credential.token);
    } catch (error:any) {
      setAuthError(error instanceof Error ? error : new Error('Authentication failed'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to sign out
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await apiSignOut();
      document.cookie = 'auth_success=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error : new Error('Sign out failed'));
    } finally {
      setLoading(false);
    }
  };

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