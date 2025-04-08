import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase'; // Firebase client initialization

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

const FeedbackAnalytics = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStat[]>([]);
  const [reactionStats, setReactionStats] = useState<ReactionCounts>({
    thumbsUp: 0,
    celebrate: 0,
    insightful: 0,
    meh: 0,
    total: 0
  });
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        if (!firestore) {
          console.error('Firestore is not initialized');
          setIsLoading(false);
          return;
        }
        
        // Fetch site statistics 
        try {
          const statsDoc = await getDoc(doc(firestore, 'site-stats', 'global'));
          if (statsDoc.exists()) {
            const statsData = statsDoc.data();
            
            // Update visitor count
            if (statsData.visits) {
              setVisitorCount(statsData.visits);
            }
            
            // Update reaction stats
            if (statsData.reactions) {
              setReactionStats({
                thumbsUp: statsData.reactions.thumbsUp || 0,
                celebrate: statsData.reactions.celebrate || 0,
                insightful: statsData.reactions.insightful || 0,
                meh: statsData.reactions.meh || 0,
                total: statsData.reactions.total || 0
              });
            }
          }
        } catch (statsError) {
          console.error('Error fetching site statistics:', statsError);
        }
        
        // Fetch feedback data
        const q = query(
          collection(firestore, 'feedback'),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const feedback: FeedbackItem[] = [];
        
        // Process data for charts
        const categories: Record<string, number> = {};
        const sentiments: Record<string, number> = {
          positive: 0,
          neutral: 0,
          negative: 0,
          unclassified: 0
        };
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<FeedbackItem, 'id'>;
          const item = {
            id: doc.id,
            ...data
          };
          
          feedback.push(item);
          
          // Accumulate category stats
          categories[data.category] = (categories[data.category] || 0) + 1;
          
          // Accumulate sentiment stats
          const classification = data.classification || 'unclassified';
          sentiments[classification] = (sentiments[classification] || 0) + 1;
        });
        
        // Format for charts
        const categoryData = Object.keys(categories).map((key) => ({
          name: key,
          count: categories[key],
        }));
        
        const sentimentData = Object.keys(sentiments).map((key) => ({
          name: key,
          value: sentiments[key],
        }));
        
        setFeedbackData(feedback);
        setCategoryStats(categoryData);
        setSentimentStats(sentimentData);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedback();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-center">Loading feedback data...</div>;
  }

  // For now we'll render a simple table without recharts
  // We can enhance this with charts once it's working
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Feedback Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Feedback Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-steel-blue">{feedbackData.length}</p>
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
                {feedbackData.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 capitalize">{item.category}</td>
                    <td className="px-4 py-2 max-w-xs truncate">{item.feedback}</td>
                    <td className="px-4 py-2 text-xs">{item.page}</td>
                  </tr>
                ))}
                {feedbackData.length === 0 && (
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
              {feedbackData.slice(0, 10).map((item) => (
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
              {feedbackData.length === 0 && (
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