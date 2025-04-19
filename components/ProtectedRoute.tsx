// components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

// Simple inline loading component
function SimpleLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const { isAuthenticated, loading } = auth;

  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { isAuthenticated, loading });

    if (!loading) {
      // Check for server-set auth_success cookie
      const hasAuthCookie = document.cookie.split(';').some(c => c.trim().startsWith('auth_success='));
      if (!isAuthenticated && !hasAuthCookie) {
        console.log('ProtectedRoute: No auth cookie and not authenticated, redirecting to login...');
        window.location.href = '/admin/login';
      }
    }
  }, [isAuthenticated, loading]); // Depend only on loading and isAuthenticated

  // Show loading indicator while checking auth status
  if (loading) {
    return <SimpleLoading message="Checking authentication..." />;
  }

  // Allow access if server-set auth_success cookie is present
  const hasAuthCookie = typeof window !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('auth_success='));

  // Render children if authenticated or cookie present
  if (isAuthenticated || hasAuthCookie) {
    return <>{children}</>;
  }
  return null;
}