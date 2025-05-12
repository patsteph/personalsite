import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';
import useAnalytics from '@/lib/hooks/useAnalytics';
import { ChartBarIcon, ClockIcon, GlobeAltIcon, DeviceTabletIcon } from '@heroicons/react/24/outline';

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
  // Use the analytics hook to fetch real data
  const analytics = useAnalytics();
  
  // Setup time range selection
  const timeRangeOptions = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
  ];
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <>
      <Head>
        <title>Analytics | Admin</title>
      </Head>
      
      <AdminLayout pageTitle="Analytics" loading={analytics.loading}>
        <div className="max-w-6xl mx-auto">
          {/* Time Range Selector */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border ${analytics.timeRange === option.value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} ${option.value === '7d' ? 'rounded-l-lg' : ''} ${option.value === '90d' ? 'rounded-r-lg' : ''}`}
                  onClick={() => analytics.setTimeRange(option.value as '7d' | '30d' | '90d')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Page Views</h3>
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
                <p className="mt-2 text-3xl font-semibold text-gray-900">{analytics.totalPageViews.toLocaleString()}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">During selected time period</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Unique Visitors</h3>
              <div className="flex items-center">
                <GlobeAltIcon className="h-6 w-6 text-green-500 mr-2" />
                <p className="mt-2 text-3xl font-semibold text-gray-900">{analytics.totalVisitors.toLocaleString()}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">During selected time period</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg. Session Duration</h3>
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-amber-500 mr-2" />
                <p className="mt-2 text-3xl font-semibold text-gray-900">{formatTime(analytics.avgSessionDuration)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">Bounce rate: {analytics.bounceRate}%</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 gap-8 mb-8">
            <BarChart
              title={`Page Views (${timeRangeOptions.find(o => o.value === analytics.timeRange)?.label})`}
              data={analytics.dailyPageViews}
              labels={analytics.dateLabels}
            />
            
            <BarChart
              title={`Unique Visitors (${timeRangeOptions.find(o => o.value === analytics.timeRange)?.label})`}
              data={analytics.dailyVisitors}
              labels={analytics.dateLabels}
            />
          </div>

          {/* Device Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Browser Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <DeviceTabletIcon className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Browser Distribution</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(analytics.deviceStats.browser)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([browser, count], idx) => {
                    const percentage = analytics.totalVisitors > 0 
                      ? Math.round((count / analytics.totalVisitors) * 100)
                      : 0;
                    return (
                      <div key={idx} className="flex items-center">
                        <div className="w-24 text-sm text-gray-600">{browser}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-md"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-900 ml-2">{percentage}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Operating System Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <DeviceTabletIcon className="h-5 w-5 text-indigo-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Operating Systems</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(analytics.deviceStats.os)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([os, count], idx) => {
                    const percentage = analytics.totalVisitors > 0 
                      ? Math.round((count / analytics.totalVisitors) * 100)
                      : 0;
                    return (
                      <div key={idx} className="flex items-center">
                        <div className="w-24 text-sm text-gray-600">{os}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-md"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-900 ml-2">{percentage}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Visitors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topPages.map((page, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{page.path}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{page.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{page.uniqueVisitors}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(page.avgTimeOnPage)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{page.bounceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Visitor Locations */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <GlobeAltIcon className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Visitor Locations</h3>
            </div>
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.visitorLocations.map((location, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Data source info */}
          <div className="text-center text-gray-500 text-sm">
            <p>Data Source: {analytics.error ? 'Demo data (could not access real data)' : 'Real analytics from Firestore'}</p>
            {analytics.error && (
              <div className="mt-2 text-red-500">
                <p>Error accessing analytics data: {analytics.error.message}</p>
                <p className="mt-1">Please verify that your Firestore permissions allow access to the trackingEvents collection.</p>
                <button 
                  className="mt-2 text-blue-600 hover:text-blue-800"
                  onClick={() => toast.success('You will need to create a composite index for the trackingEvents collection!')}
                >
                  Show Required Index
                </button>
              </div>
            )}
            
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
