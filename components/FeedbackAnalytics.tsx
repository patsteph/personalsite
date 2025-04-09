import { useEffect, useState } from 'react';

interface FeedbackItem {
  id: string;
  category: string;
  feedback: string;
  page: string;
  timestamp: any;
  classification?: string;
  status: string;
}

interface CategoryStat {
  name: string;
  count: number;
}

interface SentimentStat {
  name: string;
  value: number;
}

interface ReactionCounts {
  thumbsUp: number;
  celebrate: number;
  insightful: number;
  meh: number;
  total: number;
}

interface FeedbackAnalyticsData {
  feedbackItems: FeedbackItem[];
  categoryStats: CategoryStat[];
  sentimentStats: SentimentStat[];
  reactionStats: ReactionCounts;
  visitorCount: number;
}

const FeedbackAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<FeedbackAnalyticsData>({
    feedbackItems: [],
    categoryStats: [],
    sentimentStats: [],
    reactionStats: {
      thumbsUp: 0,
      celebrate: 0,
      insightful: 0,
      meh: 0,
      total: 0
    },
    visitorCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbackAnalytics = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/admin-analytics?type=feedback');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch feedback analytics (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Unknown error fetching feedback analytics');
        }
        
        setAnalyticsData(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching feedback analytics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedbackAnalytics();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-center">Loading feedback data...</div>;
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          Error loading feedback data: {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-steel-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { feedbackItems, categoryStats, sentimentStats, reactionStats, visitorCount } = analyticsData;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Feedback Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Feedback Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-steel-blue">{feedbackItems.length}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-steel-blue">{categoryStats.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Site Statistics</h3>
          <div className="text-center p-4">
            <p className="text-sm text-gray-500 mb-2">Total Site Visitors</p>
            <p className="text-2xl font-bold text-blue-500">{visitorCount.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-2">Based on unique visits across the site</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Categories Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoryStats.map((category) => (
                <tr key={category.name}>
                  <td className="px-4 py-2 capitalize">{category.name}</td>
                  <td className="px-4 py-2">{category.count}</td>
                </tr>
              ))}
              {categoryStats.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-center">No category data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Sentiment Distribution</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Sentiment</th>
                <th className="px-4 py-2">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sentimentStats.map((sentiment) => (
                <tr key={sentiment.name}>
                  <td className="px-4 py-2 capitalize">{sentiment.name}</td>
                  <td className="px-4 py-2">{sentiment.value}</td>
                </tr>
              ))}
              {sentimentStats.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-center">No sentiment data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Recent Feedback</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Feedback</th>
                  <th className="px-4 py-2">Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feedbackItems.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 capitalize">{item.category}</td>
                    <td className="px-4 py-2 max-w-xs truncate">{item.feedback}</td>
                    <td className="px-4 py-2 text-xs">{item.page}</td>
                  </tr>
                ))}
                {feedbackItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-center">No feedback data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Blog Reactions Summary</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded text-center">
              <span className="text-xl">👍</span>
              <p className="text-3xl font-bold text-blue-500 my-2">{reactionStats.thumbsUp}</p>
              <p className="text-xs text-gray-500">Thumbs Up</p>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <span className="text-xl">🎉</span>
              <p className="text-3xl font-bold text-purple-500 my-2">{reactionStats.celebrate}</p>
              <p className="text-xs text-gray-500">Celebrate</p>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <span className="text-xl">🧠</span>
              <p className="text-3xl font-bold text-green-500 my-2">{reactionStats.insightful}</p>
              <p className="text-xs text-gray-500">Insightful</p>
            </div>
            <div className="p-3 bg-gray-50 rounded text-center">
              <span className="text-xl">😐</span>
              <p className="text-3xl font-bold text-amber-500 my-2">{reactionStats.meh}</p>
              <p className="text-xs text-gray-500">Meh</p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4 pt-4 border-t">
            Total Reactions: <span className="font-bold">{reactionStats.total}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Detailed Feedback History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Feedback</th>
                <th className="px-4 py-2">Sentiment</th>
                <th className="px-4 py-2">Page</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {feedbackItems.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 capitalize">{item.category}</td>
                  <td className="px-4 py-2">{item.feedback}</td>
                  <td className="px-4 py-2 capitalize">{item.classification || 'unclassified'}</td>
                  <td className="px-4 py-2">{item.page}</td>
                  <td className="px-4 py-2">
                    {item.timestamp?.toDate 
                      ? new Date(item.timestamp.toDate()).toLocaleDateString() 
                      : new Date(item.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {feedbackItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-center">No feedback data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;