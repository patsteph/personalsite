import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLoading from './AdminLoading';

// Import SVG icons from heroicons
import {
  HomeIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon, 
  BookOpenIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

type AdminLayoutProps = {
  children: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  pageTitle?: string;
};

// Navigation item with icon, name, href, and color
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; // Tailwind color class
};

export default function AdminLayout({ children, loading = false, loadingMessage, pageTitle }: AdminLayoutProps) {
  const router = useRouter();
  
  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, color: 'text-blue-500' },
    { name: 'Blog Posts', href: '/admin/blog', icon: DocumentTextIcon, color: 'text-green-500' },
    { name: 'CV', href: '/admin/cv', icon: DocumentDuplicateIcon, color: 'text-purple-500' },
    { name: 'Books', href: '/admin/books', icon: BookOpenIcon, color: 'text-amber-500' },
    { name: 'Signals', href: '/admin/signals', icon: SignalIcon, color: 'text-red-500' },
    { name: 'Content Items', href: '/admin/content-items', icon: PuzzlePieceIcon, color: 'text-indigo-500' },
    { name: 'Easter Eggs', href: '/admin/easter-eggs', icon: UserGroupIcon, color: 'text-pink-500' },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon, color: 'text-gray-500' },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || 
      (path !== '/admin' && router.pathname.startsWith(path));
  };

  // Get title for current page
  const currentPageTitle = pageTitle || 
    navItems.find(item => isActive(item.href))?.name || 
    'Admin Dashboard';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md z-10">
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    active
                      ? 'bg-gray-100 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-4 py-3 text-sm rounded-md transition-all duration-150 ease-in-out`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? item.color : 'text-gray-400 group-hover:text-gray-500'}`} 
                    aria-hidden="true" 
                  />
                  <span className={active ? item.color : ''}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header with page title */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">{currentPageTitle}</h1>
          </div>
        </div>
        
        {/* Page content */}
        <div className="p-8">
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
