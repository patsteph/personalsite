// pages/admin/index.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/translations';
import { getBasePath } from '@/lib/firebase';

// Dynamically import the BookForm component to reduce initial load size
const BookForm = dynamic(() => import('@/components/admin/BookForm'), {
  loading: () => <div className="p-6 text-center">Loading book management tools...</div>,
  ssr: false // Admin section doesn't need server-side rendering
});

export default function AdminPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };
  
  return (
    <ProtectedRoute>
      <Layout section="admin">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-accent">
              {t('admin.bookManagement', 'Book Management')}
            </h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {t('admin.signOut', 'Sign Out')}
            </button>
          </div>
          
          {isSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              {t('admin.success', 'Operation completed successfully!')}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <BookForm onSuccess={handleSuccess} />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}