import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client'; 
import { TrackingEventData } from '@/lib/tracking'; 
import { useAuth } from '@/lib/auth'; 

// Interface for feedback items
interface FeedbackItem {
  id: string;
  category: string;
  feedback: string;
  page: string;
  timestamp: string;
  status: string;
  classification?: string | null;
}

// Define the structure of the event data as stored in Firestore (includes Firestore Timestamps)
interface TrackingEventDocument extends Omit<TrackingEventData, 'timestamp'> {
  timestamp: Timestamp; 
  receivedAt: Timestamp; 
}

// Define the structure after converting Timestamps for display
interface DisplayableTrackingEvent extends Omit<TrackingEventDocument, 'timestamp' | 'receivedAt'> {
  id: string; 
  timestamp: string;
  receivedAt: string;
}

const TrackingAnalytics: React.FC = () => {
  // Get all hooks at the top level, unconditionally
  const { user } = useAuth(); 
  const [events, setEvents] = useState<DisplayableTrackingEvent[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  
  // Calculate all stats from events data - MOVED before any conditional returns
  // This ensures hooks are always called in the same order
  const analyticsData = useMemo(() => {
    if (!events || events.length === 0) {
      return { 
        totalEvents: 0, 
        uniqueSessions: 0,
        topPages: [],
        topReferrers: []
      };
    }
    
    // Calculate unique sessions
    const uniqueSessionIds = new Set(events.map(e => e.sessionId));
    
    // Process top pages
    const pageCount = events.reduce((acc, event) => {
      const path = event.pathname.split('?')[0]; // Remove query params
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));
    
    // Process top referrers
    const referrerCount = events.reduce((acc, event) => {
      if (event.referrer) {
        // Extract domain from referrer
        try {
          const url = new URL(event.referrer);
          const domain = url.hostname;
          acc[domain] = (acc[domain] || 0) + 1;
        } catch (e) {
          // If URL parsing fails, use the raw referrer
          acc[event.referrer] = (acc[event.referrer] || 0) + 1;
        }
      } else {
        acc['direct'] = (acc['direct'] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topReferrers = Object.entries(referrerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
      
    // Collect feedback entries (if we had them)
    // For now this is empty until we implement feedback collection
    
    return {
      totalEvents: events.length,
      uniqueSessions: uniqueSessionIds.size,
      topPages,
      topReferrers
    };
  }, [events]);

  // Fetch tracking data effect
  useEffect(() => {
    // Check for missing dependencies and set error appropriately
    if (!db) {
      console.error("Firebase db is not initialized");
      setError("Database connection error. Please check your configuration.");
      setLoading(false);
      return;
    }
    
    if (!user) {
      // Only set error if we know user is definitely null (not just loading)
      if (user === null) {
        setError("User is not authenticated.");
        setLoading(false);
      }
      // Keep loading true if auth state is still pending
      return;
    }

    const fetchTrackingData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Type assertion to assure TypeScript db is not null here
        const firestoreDb = db as NonNullable<typeof db>;
        const eventsColRef = collection(firestoreDb, 'trackingEvents');
        
        const q = query(eventsColRef, orderBy('timestamp', 'desc'), limit(100));
        
        const querySnapshot = await getDocs(q);
        
        const fetchedEvents: DisplayableTrackingEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as TrackingEventDocument;
          fetchedEvents.push({
            ...data,
            id: doc.id, 
            // Convert Timestamps to ISO strings for simple display
            timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
            receivedAt: data.receivedAt?.toDate().toISOString() || 'N/A',
          });
        });
        
        setEvents(fetchedEvents);
      } catch (err: any) { 
        console.error("Error fetching tracking events:", err);
        setError(`Failed to load tracking data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [user]);
  
  // Fetch feedback data effect
  useEffect(() => {
    // Skip if no database or user
    if (!db || !user) return;
    
    const fetchFeedbackData = async () => {
      setFeedbackLoading(true);
      setFeedbackError(null);
      
      try {
        const firestoreDb = db as NonNullable<typeof db>;
        const feedbackColRef = collection(firestoreDb, 'feedback');
        
        // Create a query to get the most recent feedback items
        const q = query(
          feedbackColRef, 
          orderBy('timestamp', 'desc'), 
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        
        const fetchedFeedback: FeedbackItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedFeedback.push({
            id: doc.id,
            category: data.category,
            feedback: data.feedback,
            page: data.page,
            timestamp: data.timestamp?.toDate?.() 
              ? data.timestamp.toDate().toISOString() 
              : (data.clientTimestamp || new Date().toISOString()),
            status: data.status || 'new',
            classification: data.classification || null
          });
        });
        
        setFeedbackItems(fetchedFeedback);
      } catch (err: any) {
        console.error("Error fetching feedback data:", err);
        setFeedbackError(`Failed to load feedback data: ${err.message}`);
      } finally {
        setFeedbackLoading(false);
      }
    };
    
    fetchFeedbackData();
  }, [user]);

  // Conditional rendering for loading and error states
  if (loading) {
    return <div className="p-6 text-center">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Site Analytics Overview</h2>
      
      {/* Grid for Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Stats Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Summary (Last {analyticsData.totalEvents} Events)</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Unique Sessions: <span className="font-bold text-indigo-600">{analyticsData.uniqueSessions}</span></p>
            <p className="text-sm text-gray-600">Pages Viewed: <span className="font-bold text-indigo-600">{analyticsData.topPages.length}</span></p>
            <p className="text-sm text-gray-600">Traffic Sources: <span className="font-bold text-indigo-600">{analyticsData.topReferrers.length}</span></p>
          </div>
        </div>
        
        {/* Top Pages Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Top Pages</h3>
          {analyticsData.topPages.length === 0 ? (
            <p className="text-sm text-gray-500">No page view data available yet.</p>
          ) : (
            <ul className="space-y-2">
              {analyticsData.topPages.map((page, idx) => (
                <li key={idx} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="truncate max-w-[180px]" title={page.path}>{page.path || '/'}</span>
                    <span className="font-semibold text-indigo-600">{page.count}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 h-2 rounded-full w-full">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${(page.count / analyticsData.topPages[0].count) * 100}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Referrers Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Top Traffic Sources</h3>
          {analyticsData.topReferrers.length === 0 ? (
            <p className="text-sm text-gray-500">No referrer data available yet.</p>
          ) : (
            <ul className="space-y-2">
              {analyticsData.topReferrers.map((referrer, idx) => (
                <li key={idx} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="truncate max-w-[180px]" title={referrer.source}>
                      {referrer.source === 'direct' ? 'Direct Traffic' : referrer.source}
                    </span>
                    <span className="font-semibold text-emerald-600">{referrer.count}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 h-2 rounded-full w-full">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ width: `${(referrer.count / analyticsData.topReferrers[0].count) * 100}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Feedback Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-700">Site Feedback</h3>
          <span className="text-xs text-gray-500">{feedbackItems.length} items received</span>
        </div>
        
        {feedbackLoading ? (
          <div className="py-8 text-center text-gray-500">Loading feedback data...</div>
        ) : feedbackError ? (
          <div className="py-4 text-center text-red-500">{feedbackError}</div>
        ) : feedbackItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No feedback received yet.</p>
            <p className="text-xs mt-2">Feedback submissions will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbackItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium capitalize">{item.category}</td>
                    <td className="px-3 py-2 text-xs">
                      <div className="max-w-[250px] truncate" title={item.feedback}>
                        {item.feedback}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 truncate max-w-[100px]" title={item.page}>
                      {item.page}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!feedbackLoading && !feedbackError && feedbackItems.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Feedback is collected from users via the floating feedback button on each page.
          </div>
        )}
      </div>

      {/* Recent Events Card - with more reasonable fixed height */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-700">Recent Events</h3>
          <span className="text-xs text-gray-500">{events.length} events total</span>
        </div>
        {events.length === 0 ? (
          <p className="text-center text-gray-500">No tracking events found yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto border rounded"> {/* Reduced height with border */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0"> {/* Sticky header */}
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event, index) => (
                  <tr key={event.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{event.eventType}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 truncate max-w-[150px]" title={event.pathname}>{event.pathname}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 truncate max-w-[80px]" title={event.sessionId}>{event.sessionId.substring(0, 8)}...</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{event.eventData?.elementId || 'N/A'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 truncate max-w-[150px]" title={event.referrer || ''}>
                      {event.referrer ? (
                        (() => {
                          try {
                            return new URL(event.referrer).hostname;
                          } catch (e) {
                            return event.referrer;
                          }
                        })()
                      ) : (
                        <span className="italic text-gray-400">Direct</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingAnalytics;
