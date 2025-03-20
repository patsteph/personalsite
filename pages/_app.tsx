// pages/_app.tsx
import type { AppProps } from 'next/app';
import AppProviders from '@/components/AppProviders';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
