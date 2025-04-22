import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/router';
// Import Firebase client auth instance and SDK methods
import { auth } from './firebase-client'; // Import the initialized auth instance
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  User as FirebaseUser // Rename Firebase User type
} from 'firebase/auth';
// Import the API functions for SIGN IN and SIGN OUT (we still need these)
import {
  signInWithEmailAndPassword as apiSignIn, // Keep for triggering backend login
  signOut as apiSignOut,               // Keep for clearing backend session/cookie if necessary
  AppUser,                             // Keep our AppUser type
} from './api/auth'; // Assuming api/auth.ts exports these

// Define the shape of the authentication context
interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>; 
  signOut: () => Promise<void>;
  // Removed refreshToken, checkSession as SDK handles this
}

// Create the authentication context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Start loading until auth state is determined
  const router = useRouter();

  // Define protected and public routes within the admin scope
  const protectedAdminRoutes = ['/admin', '/admin/books', '/admin/blog', '/admin/signals'];
  const publicAdminRoutes = ['/admin/login'];

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    // Ensure auth is initialized before subscribing
    if (!auth) {
      console.error('AuthProvider: Firebase auth instance is not available. Cannot subscribe to state changes.');
      setLoading(false); // Stop loading, but auth won't work
      return;
    }

    console.log('AuthProvider: Setting up onAuthStateChanged listener.');
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log('AuthProvider: onAuthStateChanged triggered. User:', firebaseUser?.uid || 'null');
      if (firebaseUser) {
        // User is signed in according to Firebase SDK
        // Map the FirebaseUser to our AppUser type
        // NOTE: Additional details like 'isAdmin' are NOT available here
        //       unless fetched separately based on UID or included in custom claims.
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          // We don't have isAdmin here, remove or fetch separately if needed
        };
        setUser(appUser);
        setIsAuthenticated(true);
      } else {
        // User is signed out according to Firebase SDK
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false); // Auth state determined, stop loading
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('AuthProvider: Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect for handling route protection
  useEffect(() => {
    console.log(`AuthProvider: Protection check running. Loading: ${loading}, IsAuth: ${isAuthenticated}, Path: ${router.pathname}`);

    // Don't run protection logic until auth state is determined
    if (loading) {
      console.log('AuthProvider: Still loading, skipping protection check.');
      return;
    }

    const currentPath = router.pathname;

    // Check if the current path is a protected admin route
    const isProtectedRoute = protectedAdminRoutes.some(route => currentPath.startsWith(route));

    // If it's a protected route and user is NOT authenticated, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
      console.log('AuthProvider: User not authenticated for protected route, redirecting to login.');
      router.push('/admin/login');
      return; // Exit after redirect
    }

    // If it's the login page and user IS authenticated, redirect to admin dashboard
    if (publicAdminRoutes.includes(currentPath) && isAuthenticated) {
      console.log('AuthProvider: User authenticated on login page, redirecting to dashboard.');
      router.push('/admin');
      return; // Exit after redirect
    }

    console.log(`AuthProvider: No redirect needed for path ${currentPath}.`);

  }, [loading, isAuthenticated, router.pathname]); // Dependencies: auth state and PATHNAME

  // Sign in function - Triggers backend login, relies on onAuthStateChanged for state update
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // If user is already authenticated, don't re-initiate the process
    if (isAuthenticated) {
      console.log('AuthProvider: User already authenticated, skipping sign-in process.');
      // Optionally, trigger redirect check explicitly if needed, but the useEffect should handle it.
      // setLoading(false); // Ensure loading is false if we abort here.
      return;
    }

    console.log('AuthProvider: signIn called.');
    setLoading(true);
    try {
      // Call the API wrapper function, which now uses Firebase Client SDK
      // No need to set user state here, onAuthStateChanged will handle it
      await apiSignIn(email, password); 
      console.log('AuthProvider: Client SDK signIn successful. Waiting for onAuthStateChanged...');
      // No page reload needed, the listener should fire.
    } catch (error) {
      console.error('AuthProvider: signIn error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false); // Ensure loading stops on error
      throw error; // Re-throw the error for the caller
    }
  }, [router, isAuthenticated]); // Add router and isAuthenticated to dependency array

  // Sign out function - Signs out from Firebase SDK and clears local state
  const signOut = useCallback(async () => {
    console.log('AuthProvider: signOut called.');
    setLoading(true);
    try {
      // Sign out from Firebase Client SDK
      if (auth) {
        await firebaseSignOut(auth);
        console.log('AuthProvider: Firebase SDK signOut successful.');
      } else {
         console.warn('AuthProvider: Firebase auth instance not available for sign out.');
      }
      // Call the original API sign-out (clears localStorage token, notifies backend)
      await apiSignOut();
      console.log('AuthProvider: apiSignOut successful.');
      // We NO LONGER manually set user state here.
      // The onAuthStateChanged listener will detect the sign-out.
      router.push('/admin/login'); // Redirect to login page after sign out
    } catch (error) {
      console.error('AuthProvider: signOut error:', error);
      // Even on error, ensure local state reflects sign-out attempt
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false); // Ensure loading stops on error
      throw error; // Re-throw the error
    }
  }, [router]); // Add router to dependency array

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};