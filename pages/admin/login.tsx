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
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  return (
    <Layout section="admin">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-8 text-center">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        <LoginForm onSuccess={() => router.push('/admin')} />
      </div>
    </Layout>
  );
}

export default AdminLoginPage;