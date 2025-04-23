// lib/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth as useAuthOriginal } from '@/lib/auth';
import { AppUser } from '@/lib/api/auth';
import { notifyError } from '@/lib/utils/error-handler';

/**
 * Enhanced auth hook that extends the base useAuth hook with additional functionality
 * Adds role management and error handling to the base authentication hook
 */
export function useAuth() {
  const auth = useAuthOriginal();
  const [authError, setAuthError] = useState<Error | null>(null);

  // Clear any previous error when auth state changes
  useEffect(() => {
    if (auth.user || !auth.loading) {
      setAuthError(null);
    }
  }, [auth.user, auth.loading]);

  // Enhance sign out with error handling
  const enhancedSignOut = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      setAuthError(new Error(errorMessage));
      notifyError(error, 'useAuth.signOut');
    }
  }, [auth]);

  // Check if user has specific roles/claims
  const hasRole = useCallback((role: string): boolean => {
    if (!auth.user) return false;
    
    // Use a generic approach that works with different user types
    const user = auth.user as any;
    
    // Check for admin role in various possible locations
    // This is flexible enough to work with different auth implementations
    return (
      // Check custom claims if they exist
      (user.customClaims && !!user.customClaims[role]) ||
      // Check roles array if it exists
      (Array.isArray(user.roles) && user.roles.includes(role)) ||
      // Check direct property if it exists (e.g., user.isAdmin)
      (role in user && !!user[role]) ||
      // Default to false if no matching property found
      false
    );
  }, [auth.user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  return {
    ...auth,
    error: authError,
    signOut: enhancedSignOut,
    hasRole,
    isAdmin,
  };
}

export default useAuth;
