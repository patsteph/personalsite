import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { getBasePath } from '@/lib/firebase';
import { useTranslation } from '@/lib/translations';

// Dynamically import the LoginForm component
const LoginForm = dynamic(() => import('@/components/admin/LoginForm'), {
  loading: () => <div className="p-4 text-center">Loading login form...</div>,
  ssr: true // Login form should be available immediately
});

function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  const [redirecting, setRedirecting] = useState(false);

  console.log('AdminLoginPage - Auth state:', { isAuthenticated, loading, user: !!user });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading && !redirecting) {
      console.log('User is authenticated, redirecting to admin dashboard');
      setRedirecting(true);
      // Force hard navigation to avoid Next.js client-side routing issues
      window.location.href = '/admin';
    }
  }, [isAuthenticated, loading, redirecting]);

  const handleLoginSuccess = () => {
    console.log('Login success callback triggered');
    setRedirecting(true);
    // Force hard navigation to avoid Next.js client-side routing issues
    window.location.href = '/admin';
  };

  return (
    <Layout section="admin">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-8 text-center">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        {loading || redirecting ? (
          <div className="text-center p-4">
            {loading ? "Checking authentication status..." : "Redirecting to admin dashboard..."}
          </div>
        ) : (
          <LoginForm onSuccess={handleLoginSuccess} />
        )}
      </div>
    </Layout>
  );
}

export default AdminLoginPage;