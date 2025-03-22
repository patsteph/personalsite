// components/AppProviders.tsx
import { ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { TranslationProvider } from '@/lib/translations';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  // Hydration fix: Start with no providers until the client is hydrated
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Return null during SSR or first render to prevent hydration issues
  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center">Loading application...</div>;
  }
  
  return (
    <AuthProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </AuthProvider>
  );
}