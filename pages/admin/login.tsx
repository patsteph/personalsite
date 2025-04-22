import { useState } from 'react';
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
  const { loading } = useAuth(); 
  const { t } = useTranslation();

  // console.log('AdminLoginPage - loading state:', loading);
  // The redirection logic based on isAuthenticated is now handled centrally in AuthProvider.

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