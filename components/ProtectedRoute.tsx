// components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';
import Loading from './ui/Loading';
import { getBasePath } from '@/lib/firebase';

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
    return <Loading message="Checking authentication..." />;
  }
  
  // Only render children if user is authenticated
  return isAuthenticated ? <>{children}</> : null;
}