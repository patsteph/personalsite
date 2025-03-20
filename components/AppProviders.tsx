// components/AppProviders.tsx
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { TranslationProvider } from '@/lib/translations';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </AuthProvider>
  );
}