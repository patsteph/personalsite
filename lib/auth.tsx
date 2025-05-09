import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/router';
import { auth } from './firebase-client';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  User as FirebaseUser
} from 'firebase/auth';
import {
  signIn as apiSignIn,
  signOut as apiSignOut,
  AppUser,
} from './api/auth';

// Import the standardized cookie utilities
import { 
  setAuthCookie, 
  removeAuthCookie, 
  AUTH_COOKIE_NAME
} from './utils/cookies';

// Configuration
const REDIRECT_DELAY_MS = 300;
const DEBUG_AUTH = process.env.NODE_ENV === 'development';

/**
 * Authentication context type definition
 */
interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>; 
  signOut: () => Promise<void>;
}

/**
 * Auth context with undefined default value
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider props interface
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and protected route access
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Route definitions
  const protectedAdminRoutes = ['/admin', '/admin/books', '/admin/blog', '/admin/signals'];
  const publicAdminRoutes = ['/admin/login'];

  /**
   * Firebase Auth state change listener
   * Sets up listener on mount and cleans up on unmount
   */
  useEffect(() => {
    if (!auth) {
      if (DEBUG_AUTH) console.error('Firebase auth instance unavailable');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (DEBUG_AUTH) console.log(`Auth state changed: ${firebaseUser ? 'User signed in' : 'User signed out'}`);
      
      if (firebaseUser) {
        // Map Firebase user to our app user type
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        };
        
        setUser(appUser);
        setAuthCookie();
        setIsAuthenticated(true);
      } else {
        setUser(null);
        removeAuthCookie();
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Route protection effect
   * Redirects users based on authentication state and current route
   */
  // Use a ref to track whether a redirect is in progress
  const redirectInProgress = React.useRef(false);

  useEffect(() => {
    if (loading) return;

    // Prevent multiple redirects
    if (redirectInProgress.current) return;

    const currentPath = router.pathname;
    const isProtectedRoute = protectedAdminRoutes.some(route => 
      currentPath.startsWith(route)
    );
    
    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !isAuthenticated) {
      if (DEBUG_AUTH) console.log('Redirecting to login: protected route access attempted');
      redirectInProgress.current = true;
      router.push('/admin/login')
        .finally(() => {
          // Reset after navigation completes or fails
          setTimeout(() => {
            redirectInProgress.current = false;
          }, 1000);
        });
      return;
    }
    
    // Redirect authenticated users from login page to admin dashboard
    if (publicAdminRoutes.includes(currentPath) && isAuthenticated) {
      if (DEBUG_AUTH) console.log('Redirecting to admin: already authenticated');
      
      // Use router.push instead of window.location to avoid history API abuse
      redirectInProgress.current = true;
      router.push('/admin')
        .finally(() => {
          // Reset after navigation completes or fails
          setTimeout(() => {
            redirectInProgress.current = false;
          }, 1000);
        });
    }
  }, [loading, isAuthenticated, router.pathname, protectedAdminRoutes, publicAdminRoutes]);



  /**
   * Sign in function - Uses Firebase SDK via API wrapper
   */
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (isAuthenticated) return;

    setLoading(true);
    try {
      await apiSignIn(email, password);
      // Auth state change listener will handle the rest
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Sign out function - Handles Firebase signout and redirects to login
   */
  const signOut = useCallback(async () => {
    removeAuthCookie();
    setLoading(true);
    
    try {
      // Sign out from Firebase Client SDK
      if (auth) {
        await firebaseSignOut(auth);
      }
      
      // Call the API signout to clear any server-side state
      await apiSignOut();
      
      // Redirect to login page
      router.push('/admin/login');
    } catch (error) {
      // Even on error, ensure local state reflects sign-out
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      throw error;
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the authentication context
 * Must be used within an AuthProvider component
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};