import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/AppProviders';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Synced state for the dark mode toggle derived from the theme context
  const isDarkMode = theme === 'dark';
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Settings | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Settings" loading={loading}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">{user?.email || 'No email available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-500">Enable dark mode throughout the admin interface</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isDarkMode}
                        onChange={() => {
                          toggleTheme();
                          toast.success(`Dark mode ${!isDarkMode ? 'enabled' : 'disabled'}`);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email notifications for important events</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={emailNotifications}
                        onChange={() => {
                          setEmailNotifications(!emailNotifications);
                          toast.success(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => toast.success('Password reset email sent!')}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Change Password
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Admin Dashboard v1.0.0</p>
            <p className="mt-1">© {new Date().getFullYear()} Your Website</p>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
