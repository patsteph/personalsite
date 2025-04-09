// This file contains analytics tracking functions for client-side events
// Uses server API for tracking instead of direct Firebase access

/**
 * Track page view
 * @param pagePath Path of the page being viewed
 * @param pageTitle Title of the page being viewed
 */
export function trackPageView(pagePath: string, pageTitle: string): void {
  // Only run on client
  if (typeof window === 'undefined') {
    return;
  }
  
  // Use server API to track the page view
  try {
    fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'pageView',
        type: getPageType(pagePath),
        details: {
          path: pagePath,
          title: pageTitle
        }
      })
    }).catch(error => {
      console.error('Error tracking page view:', error);
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
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
  // Only run on client
  if (typeof window === 'undefined') {
    return;
  }
  
  // Use server API to track the user action
  try {
    fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'userAction',
        type: category,
        details: {
          action,
          category,
          ...(label && { label }),
          ...(value !== undefined && { value })
        }
      })
    }).catch(error => {
      console.error('Error tracking user action:', error);
    });
  } catch (error) {
    console.error('Error tracking user action:', error);
  }
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
  // Only run on client
  if (typeof window === 'undefined') {
    return;
  }
  
  // Use server API to track the book interaction
  try {
    fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'bookInteraction',
        type: 'book',
        details: {
          interactionType: action,
          ...(bookId && { book_id: bookId }),
          ...(details && details)
        }
      })
    }).catch(error => {
      console.error('Error tracking book interaction:', error);
    });
  } catch (error) {
    console.error('Error tracking book interaction:', error);
  }
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
  // Only run on client
  if (typeof window === 'undefined') {
    return;
  }
  
  // Use server API to track the blog interaction
  try {
    fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'blogInteraction',
        type: 'blog',
        details: {
          interactionType: action,
          ...(postId && { post_id: postId }),
          ...(details && details)
        }
      })
    }).catch(error => {
      console.error('Error tracking blog interaction:', error);
    });
  } catch (error) {
    console.error('Error tracking blog interaction:', error);
  }
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
  // Only run on client
  if (typeof window === 'undefined') {
    return;
  }
  
  // Use server API to track the contact interaction
  try {
    fetch('/api/site-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'contactInteraction',
        type: 'contact',
        details: {
          method,
          ...(details && details)
        }
      })
    }).catch(error => {
      console.error('Error tracking contact interaction:', error);
    });
  } catch (error) {
    console.error('Error tracking contact interaction:', error);
  }
}

/**
 * Helper function to determine page type from path
 */
function getPageType(path: string): string {
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/books')) return 'book';
  if (path.startsWith('/cv')) return 'cv';
  if (path.startsWith('/contact')) return 'contact';
  if (path.startsWith('/signals')) return 'signals';
  if (path.startsWith('/admin')) return 'admin';
  return 'other';
}