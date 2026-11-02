// pages/_app.tsx
import type { AppProps } from 'next/app';
import AppProviders from '@/components/AppProviders';
import GoogleTranslate from '@/components/GoogleTranslate';
import '../styles/globals.css';
import '../styles/algolia.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <GoogleTranslate />
      <Component {...pageProps} />
    </AppProviders>
  );
}
