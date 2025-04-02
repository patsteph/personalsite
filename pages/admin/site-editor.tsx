// pages/admin/site-editor.tsx
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the site content editor to avoid SSR issues
const SiteContentEditor = dynamic(() => import('@/components/admin/SiteContentEditor'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
});

const SiteEditorPage: NextPage = () => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated and authorized
    if (!loading && user) {
      setIsAuthorized(true);
    }
  }, [user, loading]);
  
  if (loading) {
    return (
      <Layout section="admin" title="Site Content Editor">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-pulse text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }
  
  if (!isAuthorized) {
    return (
      <Layout section="admin" title="Site Content Editor">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-3xl mx-auto my-8">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You need to be logged in as an administrator to access this page.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/admin/login"
              className="px-4 py-2 bg-steel-blue text-white rounded-md hover:bg-accent transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout section="admin" title="Site Content Editor">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-steel-blue mb-2">Site Content Editor</h1>
          <p className="text-gray-600">Edit content for different sections of your website.</p>
        </div>
        
        <SiteContentEditor />
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-4">
            <Link 
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SiteEditorPage;