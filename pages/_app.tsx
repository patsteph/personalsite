// pages/_app.tsx
import type { AppProps } from 'next/app';
import AppProviders from '@/components/AppProviders';
import GTranslateWidget from '@/components/GTranslateWidget';
import '../styles/globals.css';
import '../styles/algolia.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      {/* Mounted once here (not inside Layout) so it survives client-side
          page navigation instead of remounting with each page's footer. */}
      <GTranslateWidget />
      <Component {...pageProps} />
    </AppProviders>
  );
}
