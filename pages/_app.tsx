import { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '@/lib/auth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Personal website of a Senior Engineering Manager" />
        <link rel="icon" href="/favicon.ico" />
        <title>Your Name - Senior Engineering Manager</title>
      </Head>
      
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;