import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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

const FeedbackAnalytics = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        if (!firestore) {
          console.error('Firestore is not initialized');
          setIsLoading(false);
          return;
        }
        
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
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Recent Feedback</h3>
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