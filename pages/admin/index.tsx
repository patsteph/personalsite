import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import LoginForm from '@/components/admin/LoginForm';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useTranslation } from '@/lib/translations';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [pageLoading, setPageLoading] = useState(true);
  
  // After auth state is determined, set page loading to false
  useEffect(() => {
    if (!loading) {
      setPageLoading(false);
    }
  }, [loading]);
  
  // Handle successful login
  const handleLoginSuccess = () => {
    // Refresh the page to show the admin dashboard
    router.reload();
  };
  
  if (pageLoading) {
    return (
      <Layout section="admin">
        <div className="flex justify-center items-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </Layout>
    );
  }
  
  // If not authenticated, show login form
  if (!user) {
    return (
      <Layout section="admin">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
          {t('admin.login', 'Admin Login')}
        </h1>
        
        <LoginForm onSuccess={handleLoginSuccess} />
      </Layout>
    );
  }
  
  // If authenticated, show admin dashboard
  return (
    <Layout section="admin">
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
        Admin Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-steel-blue mb-4">Book Management</h2>
          <p className="text-gray-600 mb-4">
            Add, edit, or remove books from your collection. The books are displayed on virtual 
            bookshelves that visitors can browse and explore.
          </p>
          <Link
            href="/admin/books"
            className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Manage Books
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-steel-blue mb-4">Account Settings</h2>
          <p className="text-gray-600 mb-4">
            Update your admin credentials, manage login settings, or update your Firebase configuration.
          </p>
          <button
            onClick={() => alert('This feature is not implemented in the demo.')}
            className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Account Settings
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-steel-blue mb-4">Admin Information</h2>
        <div className="mb-4">
          <p className="text-gray-600">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-gray-600">
            <strong>Last Sign In:</strong> {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unknown'}
          </p>
        </div>
        
        <button
          onClick={() => {
            useAuth().signOut();
            router.reload();
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    </Layout>
  );
}