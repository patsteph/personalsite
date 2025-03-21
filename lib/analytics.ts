// This file contains analytics tracking functions
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, logEvent, isSupported, Analytics } from 'firebase/analytics';

// Global analytics instance
let analyticsInstance: Analytics | null = null;

/**
 * Initialize Firebase Analytics
 */
export async function initAnalytics(): Promise<Analytics | null> {
  // Only run on client
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if analytics is supported in this environment
  if (!(await isSupported())) {
    console.warn('Firebase Analytics is not supported in this environment');
    return null;
  }

  try {
    // Get Firebase config from window
    let firebaseConfig = null;
    
    // Try to use secure config first
    if (window.SECURE_CONFIG?.firebase?.apiKey) {
      console.log('Using Firebase config from SECURE_CONFIG for analytics');
      firebaseConfig = window.SECURE_CONFIG.firebase;
    } 
    // Fallback to runtime config
    else if (window.runtimeConfig?.firebase?.apiKey) {
      console.log('Using Firebase config from runtimeConfig for analytics');
      firebaseConfig = window.runtimeConfig.firebase;
    }
    
    if (!firebaseConfig?.apiKey) {
      console.error('No Firebase config available for analytics');
      return null;
    }

    // Initialize Firebase (or reuse existing)
    let app;
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // Initialize Analytics
    analyticsInstance = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
    return analyticsInstance;
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
    return null;
  }
}

/**
 * Log an analytics event
 * @param eventName Name of the event to log
 * @param eventParams Optional parameters to include with the event
 */
export function logAnalyticsEvent(eventName: string, eventParams?: Record<string, any>): void {
  // Initialize analytics if not already done
  if (!analyticsInstance) {
    initAnalytics().then(instance => {
      if (instance) {
        logEvent(instance, eventName, eventParams);
      }
    }).catch(error => {
      console.error('Error initializing analytics for event logging:', error);
    });
    return;
  }

  // Log the event using the existing instance
  try {
    logEvent(analyticsInstance, eventName, eventParams);
  } catch (error) {
    console.error(`Error logging analytics event ${eventName}:`, error);
  }
}

/**
 * Track page view
 * @param pagePath Path of the page being viewed
 * @param pageTitle Title of the page being viewed
 */
export function trackPageView(pagePath: string, pageTitle: string): void {
  logAnalyticsEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
}

/**
 * Track user action
 * @param action The action the user performed
 * @param category The category of the action
 * @param label Optional label for the action
 * @param value Optional numeric value associated with the action
 */
export function trackUserAction(
  action: string, 
  category: string, 
  label?: string, 
  value?: number
): void {
  logAnalyticsEvent('user_action', {
    action,
    category,
    ...(label && { label }),
    ...(value !== undefined && { value })
  });
}

/**
 * Track book interactions
 * @param action The action performed (view, search, filter)
 * @param bookId Optional book ID for specific book interactions
 * @param details Additional details about the interaction
 */
export function trackBookInteraction(
  action: 'view' | 'detail' | 'search' | 'filter',
  bookId?: string,
  details?: Record<string, any>
): void {
  logAnalyticsEvent('book_interaction', {
    action,
    ...(bookId && { book_id: bookId }),
    ...(details && details)
  });
}

/**
 * Track blog interactions
 * @param action The action performed (view, search)
 * @param postId Optional post ID for specific post interactions
 * @param details Additional details about the interaction
 */
export function trackBlogInteraction(
  action: 'view' | 'search' | 'filter',
  postId?: string,
  details?: Record<string, any>
): void {
  logAnalyticsEvent('blog_interaction', {
    action,
    ...(postId && { post_id: postId }),
    ...(details && details)
  });
}

/**
 * Track contact interactions
 * @param method The contact method used (email, phone, form)
 * @param details Additional details about the interaction
 */
export function trackContactInteraction(
  method: 'email' | 'phone' | 'form' | 'social',
  details?: Record<string, any>
): void {
  logAnalyticsEvent('contact_interaction', {
    method,
    ...(details && details)
  });
}