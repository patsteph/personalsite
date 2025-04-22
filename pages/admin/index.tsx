// pages/admin/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/translations';

// Dynamically import components to reduce initial load size

// NEW: Dynamically import TrackingAnalytics
const TrackingAnalytics = dynamic(() => import('@/components/admin/TrackingAnalytics'), {
  loading: () => <div className="p-6 text-center">Loading analytics data...</div>,
  ssr: false // Admin section doesn't need server-side rendering
});

export default function AdminPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'analytics'
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  const navigateTo = (path: string) => {
    router.push(path);
  };
  
  return (
    <Layout section="admin"> 
      {/* Simplified content for debugging */} 
      <div className="p-6"> 
        <h1 className="text-3xl font-bold text-accent">Admin Dashboard (Simplified)</h1> 
        <p className="mt-4">If you see this, the redirect worked!</p> 
        <button 
          onClick={handleSignOut} 
          className="mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors" 
        > 
          {t('admin.signOut', 'Sign Out')} 
        </button> 
      </div> 
    </Layout>
  );
}