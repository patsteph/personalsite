import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client'; 
import { TrackingEventData } from '@/lib/tracking'; 
import { useAuth } from '@/lib/auth'; 

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
  const { user } = useAuth(); 
  const [events, setEvents] = useState<DisplayableTrackingEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data if db is initialized AND user exists
    if (!db || !user) {
        // If db isn't ready or user isn't logged in, don't fetch yet.
        // Set loading to false if user is definitively null (meaning not logged in)
        // If db is null or user is null because auth is still loading, keep loading true.
        if (user === null) {
            setLoading(false);
            setError("User is not authenticated.");
        }
        // Keep loading true if db is null or auth state is pending
        return; 
    }

    const fetchTrackingData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!db) {
          throw new Error("Firestore is not initialized. Check Firebase client configuration.");
        }
        const eventsColRef = collection(db, 'trackingEvents');
        
        const q = query(eventsColRef, orderBy('timestamp', 'desc'), limit(100));
        
        const querySnapshot = await getDocs(q);
        
        const fetchedEvents: DisplayableTrackingEvent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as TrackingEventDocument;
          fetchedEvents.push({
            ...data,
            id: doc.id, 
            // Convert Timestamps to ISO strings for simple display
            timestamp: data.timestamp.toDate().toISOString(),
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

  if (loading) {
    return <div className="p-6 text-center">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  // Calculate some basic summary stats (client-side for now)
  const summaryStats = useMemo(() => {
    if (!events || events.length === 0) {
      return { totalEvents: 0, uniqueSessions: 0 };
    }
    const uniqueSessionIds = new Set(events.map(e => e.sessionId));
    return {
      totalEvents: events.length,
      uniqueSessions: uniqueSessionIds.size,
    };
  }, [events]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Site Analytics Overview</h2>
      
      {/* Grid for Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Stats Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Summary (Last {summaryStats.totalEvents} Events)</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Unique Sessions: <span className="font-bold text-indigo-600">{summaryStats.uniqueSessions}</span></p>
            {/* Add more summary stats here later */} 
          </div>
        </div>
        
        {/* Placeholder: Top Pages Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Top Pages (Placeholder)</h3>
          <p className="text-sm text-gray-500">Analysis coming soon...</p>
        </div>

        {/* Placeholder: Top Referrers Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Top Referrers (Placeholder)</h3>
          <p className="text-sm text-gray-500">Analysis coming soon...</p>
        </div>
      </div>

      {/* Recent Events Card */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Recent Events</h3>
        {events.length === 0 ? (
          <p className="text-center text-gray-500">No tracking events found yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto"> {/* Limit height and enable scrolling */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0"> {/* Sticky header */}
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event, index) => (
                  <tr key={event.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{event.eventType}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={event.pathname}>{event.pathname}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-[100px]" title={event.sessionId}>{event.sessionId}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{event.eventData?.elementId || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={event.referrer || ''}>{event.referrer || <span className="italic text-gray-400">Direct</span>}</td> {/* Nicer display for direct */} 
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
