// pages/admin/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/translations';
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchJson } from '@/lib/fetch-json';
import toast from 'react-hot-toast';

// Import dashboard stat icons
import {
  DocumentTextIcon,
  BookOpenIcon,
  SignalIcon,
  UserIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
};

// Stats dashboard card component
const StatCard = ({ title, value, description, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-150 hover:shadow-lg">
    <div className="flex items-start">
      <div className={`${color} bg-opacity-10 p-3 rounded-lg`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="ml-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="mt-1 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  </div>
);

// Chart section component
const ChartSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

// Stats summary interface
interface DashboardStats {
  posts: number;
  books: number;
  signals: number;
  visitors: number;
  pageViews: number;
  recentVisitors: number[];
  popularContent: Array<{name: string, views: number}>;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch real stats from our API endpoint
        const response = await fetchJson<{success: boolean, data?: DashboardStats, error?: string}>('/api/admin/dashboard-stats');
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          toast.error('Failed to load dashboard statistics');
          console.error('API returned error:', response.error);
        }
      } catch (err) {
        toast.error('Error loading dashboard statistics');
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <AdminLayout 
      loading={loading} 
      loadingMessage="Loading dashboard statistics..."
      pageTitle="Dashboard Overview"
    >
      {stats && (
        <div className="space-y-8">
          {/* Key stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Blog Posts"
              value={stats.posts}
              description="Total published articles"
              icon={DocumentTextIcon}
              color="text-green-500"
            />
            <StatCard
              title="Books"
              value={stats.books}
              description="Books in your collection"
              icon={BookOpenIcon}
              color="text-amber-500"
            />
            <StatCard
              title="Signals"
              value={stats.signals}
              description="Published signals and newsletters"
              icon={SignalIcon}
              color="text-red-500"
            />
          </div>
          
          {/* Visitor stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Unique Visitors"
              value={stats.visitors.toLocaleString()}
              description="Last 30 days"
              icon={UserIcon}
              color="text-blue-500"
            />
            <StatCard
              title="Page Views"
              value={stats.pageViews.toLocaleString()}
              description="Last 30 days"
              icon={EyeIcon}
              color="text-indigo-500"
            />
            <StatCard
              title="Avg. Engagement"
              value="4.7"
              description="Average user rating"
              icon={StarIcon}
              color="text-purple-500"
            />
          </div>
          
          {/* Chart sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection title="Visitor Traffic (Last 7 Days)">
              <div className="h-64 flex items-end justify-between px-4">
                {stats.recentVisitors.map((count, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-12 rounded-t-lg" 
                      style={{height: `${(count/60) * 100}%`}}
                    />
                    <span className="text-xs mt-2">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                  </div>
                ))}
              </div>
            </ChartSection>
            
            <ChartSection title="Most Popular Content">
              <div className="space-y-4">
                {stats.popularContent.map((item, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{width: `${(item.views/stats.popularContent[0].views) * 100}%`}}
                      />
                    </div>
                    <div className="ml-4 min-w-[100px] text-right">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{item.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartSection>
          </div>
          
          {/* Quick actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => toast.success('Coming soon!')}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
              >
                Create New Blog Post
              </button>
              <button 
                onClick={() => toast.success('Coming soon!')}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-md text-sm font-medium hover:bg-amber-200 transition-colors"
              >
                Add New Book
              </button>
              <button 
                onClick={() => toast.success('Coming soon!')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Create Signal
              </button>
              <button 
                onClick={() => toast.success('Coming soon!')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
              >
                Export Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}