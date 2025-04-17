import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
// getBasePath not used
import { useTranslation } from '@/lib/translations';

// Dynamically import the LoginForm component
const LoginForm = dynamic(() => import('@/components/admin/LoginForm'), {
  loading: () => <div className="p-4 text-center">Loading login form...</div>,
  ssr: true // Login form should be available immediately
});

function AdminLoginPage() {
  // Not using Next.js router as we redirect with window.location for a full page reload
  // const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth(); // Rely solely on useAuth state
  const { t } = useTranslation();

  console.log('AdminLoginPage - Auth state:', { isAuthenticated, loading, user: !!user });

  // Redirect if already authenticated
  useEffect(() => {
    // If authentication check is done and user is authenticated, redirect away
    if (isAuthenticated && !loading) {
      console.log('User is authenticated, redirecting to admin dashboard');
      // Force hard navigation to avoid Next.js client-side routing issues
      window.location.href = '/admin';
    }
  }, [isAuthenticated, loading]); // Dependencies are just auth state

  return (
    <Layout section="admin">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-8 text-center">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        {/* Show loading indicator only while useAuth is resolving */}
        {loading ? (
          <div className="text-center p-4">
            {"Checking authentication status..."}
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </Layout>
  );
}

export default AdminLoginPage;