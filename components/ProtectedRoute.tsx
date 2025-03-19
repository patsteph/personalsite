// components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';
import { getBasePath } from '@/lib/firebase';

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
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If auth is finished loading and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      console.log('No authenticated user found, redirecting to login');
      router.replace('/admin/login');
    }
  }, [user, loading, isAuthenticated, router]);
  
  // Show loading indicator while checking auth status
  if (loading) {
    return <SimpleLoading message="Checking authentication..." />;
  }
  
  // Only render children if user is authenticated
  return isAuthenticated ? <>{children}</> : null;
}