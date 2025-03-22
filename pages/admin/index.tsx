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
  
  const navigateTo = (path: string) => {
    router.push(path);
  };
  
  return (
    <ProtectedRoute>
      <Layout section="admin">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-accent">
              {t('admin.dashboard', 'Admin Dashboard')}
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
          
          {/* Admin Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Books Management Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-steel-blue bg-opacity-20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-steel-blue">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-steel-blue mb-2">Book Management</h2>
                <p className="text-gray-600 mb-4">Add, edit, and manage your book collection.</p>
                <button 
                  onClick={() => navigateTo('/admin/books')}
                  className="w-full py-2 bg-steel-blue text-white rounded hover:bg-opacity-90 transition-colors"
                >
                  Manage Books
                </button>
              </div>
            </div>
            
            {/* Signals Management Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-amber-600 bg-opacity-20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-amber-600 mb-2">Signals</h2>
                <p className="text-gray-600 mb-4">Manage newsletters and articles you recommend.</p>
                <button 
                  onClick={() => navigateTo('/admin/signals')}
                  className="w-full py-2 bg-amber-600 text-white rounded hover:bg-opacity-90 transition-colors"
                >
                  Manage Signals
                </button>
              </div>
            </div>
            
            {/* Blog Management Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-indigo-600 mb-2">Blog Management</h2>
                <p className="text-gray-600 mb-4">Write, edit, and publish blog posts.</p>
                <button 
                  className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-opacity-90 transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigateTo('/admin/books')}
                className="px-4 py-2 bg-steel-blue text-white rounded hover:bg-opacity-90 transition-colors"
              >
                Add New Book
              </button>
              <button 
                onClick={() => navigateTo('/admin/signals')}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-opacity-90 transition-colors"
              >
                Add New Signal
              </button>
              <button 
                onClick={() => window.open('/admin-dashboard.html', '_blank')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-opacity-90 transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}