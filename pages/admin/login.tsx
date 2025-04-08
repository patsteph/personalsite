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
    
    // Add a clear message for the user
    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;"><div style="border-radius: 50%; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; animation: spin 1s linear infinite; margin-bottom: 20px;"></div><h2>Login successful! Redirecting to admin dashboard...</h2><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></div>';
    
    // Delay and then force full page reload to admin page
    setTimeout(() => {
      window.location.replace('/admin');
    }, 1000);
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