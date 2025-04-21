// components/AppProviders.tsx
import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/lib/auth';
import { TranslationProvider } from '@/lib/translations';
import { getTrackingSessionId, trackEvent } from '@/lib/tracking';
import dynamic from 'next/dynamic';

// Dynamically import the FeedbackWidget with no SSR to avoid hydration issues
const FeedbackWidget = dynamic(() => import('./FeedbackWidget'), { ssr: false });

// Theme context interface
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Create the theme context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  // Hydration fix: Start with no providers until the client is hydrated
  const [isClient, setIsClient] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Initialize theme and tracking when client is available
  useEffect(() => {
    setIsClient(true);
    
    // Initialize tracking session and log initial page view
    getTrackingSessionId(); // Ensures session ID is set
    trackEvent('pageview'); // Track initial page load

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  // Hook up page view tracking to router events
  const router = useRouter();
  useEffect(() => {
    // Function to handle route changes
    const handleRouteChange = (url: string) => {
      // Track page view on route change complete
      // The pathname is already captured within trackEvent using window.location
      trackEvent('pageview');
      // Optionally, you could pass the url if needed:
      // trackEvent('pageview', { targetUrl: url });
    };

    // Subscribe to the event
    router.events.on('routeChangeComplete', handleRouteChange);

    // Unsubscribe from the event on component unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]); // Re-run if router.events changes (though typically stable)

  // Global click listener for interaction tracking
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      let targetElement = event.target as HTMLElement;
      
      // Traverse up the DOM tree to find the tracking ID (max 5 levels up)
      let trackingId: string | null = null;
      let elementTag: string = '';
      let levels = 0;
      while (targetElement && levels < 5) {
        trackingId = targetElement.getAttribute('data-track-id');
        if (trackingId) {
          elementTag = targetElement.tagName;
          break;
        }
        targetElement = targetElement.parentElement as HTMLElement;
        levels++;
      }

      if (trackingId) {
        // console.log(`Interaction tracked: ${trackingId}`);
        trackEvent('interaction', {
          elementId: trackingId,
          elementType: elementTag,
          // Optional: add more context like text content if needed
          // elementText: targetElement.textContent?.trim().substring(0, 50) 
        });
      }
    };

    // Add the listener to the document body
    document.body.addEventListener('click', handleClick);

    // Clean up the listener on component unmount
    return () => {
      document.body.removeEventListener('click', handleClick);
    };
  }, []); // Empty dependency array ensures this runs only once on mount/unmount
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update localStorage
    localStorage.setItem('theme', newTheme);
    
    // Update document class for CSS
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Return null during SSR or first render to prevent hydration issues
  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center">Loading application...</div>;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthProvider>
        <TranslationProvider>
          {children}
          <FeedbackWidget />
        </TranslationProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}