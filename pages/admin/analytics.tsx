import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

// Simple chart component for demonstration
const BarChart = ({ data, labels, title }: { data: number[], labels: string[], title: string }) => {
  // Find the max value to scale the bars
  const maxValue = Math.max(...data);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((value, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600">{labels[index]}</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-md"
                style={{ width: `${(value / maxValue) * 100}%` }}
              ></div>
            </div>
            <div className="w-12 text-right text-sm text-gray-900 ml-2">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState<number[]>([]);
  const [visitors, setVisitors] = useState<number[]>([]);
  const [dateLabels, setDateLabels] = useState<string[]>([]);
  
  useEffect(() => {
    // Simulate fetching analytics data
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch data from an API
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate last 7 days
        const dates = [];
        const viewsData = [];
        const visitorsData = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
          
          // Generate random data
          viewsData.push(Math.floor(Math.random() * 500) + 100);
          visitorsData.push(Math.floor(Math.random() * 200) + 50);
        }
        
        setDateLabels(dates);
        setPageViews(viewsData);
        setVisitors(visitorsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  // Calculate totals
  const totalPageViews = pageViews.reduce((sum, views) => sum + views, 0);
  const totalVisitors = visitors.reduce((sum, count) => sum + count, 0);
  const averageTimeOnPage = Math.floor(Math.random() * 200) + 30; // Random value between 30-230 seconds
  
  return (
    <>
      <Head>
        <title>Analytics | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Analytics" loading={loading}>
        <div className="max-w-6xl mx-auto">
          {/* Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Page Views</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalPageViews}</p>
              <p className="mt-1 text-sm text-green-600">+4.75% from last week</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Unique Visitors</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalVisitors}</p>
              <p className="mt-1 text-sm text-green-600">+1.2% from last week</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg. Time on Page</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{Math.floor(averageTimeOnPage / 60)}m {averageTimeOnPage % 60}s</p>
              <p className="mt-1 text-sm text-red-600">-0.4% from last week</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 gap-8 mb-8">
            <BarChart
              title="Page Views (Last 7 Days)"
              data={pageViews}
              labels={dateLabels}
            />
            
            <BarChart
              title="Unique Visitors (Last 7 Days)"
              data={visitors}
              labels={dateLabels}
            />
          </div>
          
          {/* Popular pages */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Pages</h3>
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { page: 'Homepage', views: 845, time: '2m 12s', bounce: '23%' },
                    { page: 'Blog Posts', views: 684, time: '3m 42s', bounce: '34%' },
                    { page: 'Books', views: 456, time: '1m 58s', bounce: '28%' },
                    { page: 'Signals', views: 312, time: '2m 37s', bounce: '41%' },
                    { page: 'CV', views: 289, time: '1m 44s', bounce: '19%' }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.page}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bounce}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Note about demo data */}
          <div className="text-center text-gray-500 text-sm">
            <p>Note: This is demo data. Connect to Google Analytics or similar service for real analytics.</p>
            <button 
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => toast.success('Analytics integration option will be available soon!')}
            >
              Connect Analytics Service
            </button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
