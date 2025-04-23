import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLoading from './AdminLoading';

type AdminLayoutProps = {
  children: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
};

export default function AdminLayout({ children, loading = false, loadingMessage }: AdminLayoutProps) {
  const router = useRouter();
  
  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Blog Posts', href: '/admin/blog' },
    { name: 'CV', href: '/admin/cv' },
    { name: 'Books', href: '/admin/books' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || 
      (path !== '/admin' && router.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md z-10">
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="p-6">
          {loading ? (
            <AdminLoading message={loadingMessage} />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
