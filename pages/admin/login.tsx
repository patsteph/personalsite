import { useEffect } from 'react';
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

  console.log('AdminLoginPage - Auth state:', { isAuthenticated, loading, user: !!user });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('User is authenticated, redirecting to admin dashboard');
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router]);

  const handleLoginSuccess = () => {
    console.log('Login success callback triggered');
    // Use replace instead of push to avoid back button issues
    router.replace('/admin');
  };

  return (
    <Layout section="admin">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-8 text-center">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        {loading ? (
          <div className="text-center p-4">Checking authentication status...</div>
        ) : (
          <LoginForm onSuccess={handleLoginSuccess} />
        )}
      </div>
    </Layout>
  );
}

export default AdminLoginPage;