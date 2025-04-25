import { v4 as uuidv4 } from 'uuid';

// Store session ID in sessionStorage to persist across page loads but not across browser sessions
const SESSION_ID_KEY = 'tracking_session_id';

/**
 * Gets the current tracking session ID or generates a new one.
 */
export function getTrackingSessionId(): string {
  if (typeof window === 'undefined') return 'server'; // No session ID during SSR

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Interface for the data sent to the tracking API
export interface TrackingEventData {
  sessionId: string;
  eventType: 'pageview' | 'interaction' | 'custom';
  pathname: string;
  referrer: string | null;
  userAgent: string | null;
  timestamp: string; // ISO string format
  eventData?: Record<string, any>; // For interaction details or custom data
}

/**
 * Tracks an event by sending data to the site-stats API.
 *
 * @param eventType Type of the event (e.g., 'pageview', 'interaction')
 * @param eventData Optional additional data specific to the event (e.g., clicked element ID)
 */
export async function trackEvent(
  eventType: TrackingEventData['eventType'],
  eventData?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('trackEvent called on server-side. Skipping.');
    return;
  }

  const payload: TrackingEventData = {
    sessionId: getTrackingSessionId(),
    eventType: eventType,
    pathname: window.location.pathname + window.location.search, // Include query params
    referrer: document.referrer || null,
    userAgent: navigator.userAgent || null,
    timestamp: new Date().toISOString(),
    ...(eventData && { eventData: eventData }),
  };

  try {
    // Use navigator.sendBeacon if available for reliability on page unload
    // Otherwise, fall back to fetch
    // Note: sendBeacon sends POST requests with limited data size (~64KB)
    //       and Content-Type application/x-www-form-urlencoded or text/plain or multipart/form-data
    //       We'll use fetch for simplicity here as sendBeacon with JSON needs Blob conversion.

    // console.log('Tracking event:', payload);

    const response = await fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true, // Important for fetch requests that might happen during page unload
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read response text');
      console.error(`Failed to track event: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText
      });
    }
  } catch (error) {
    console.error('Error tracking event:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
