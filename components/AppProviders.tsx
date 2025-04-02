// components/AppProviders.tsx
import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { AuthProvider } from '@/lib/auth';
import { TranslationProvider } from '@/lib/translations';

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
  
  // Initialize theme from localStorage when client is available
  useEffect(() => {
    setIsClient(true);
    
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
        </TranslationProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}