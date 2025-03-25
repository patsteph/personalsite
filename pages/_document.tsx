import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Determine if we should use strict CSP in production
  const enableStrictCSP = process.env.NEXT_PUBLIC_ENABLE_STRICT_CSP === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  // CSP directives - can be adjusted based on needs
  const cspContent = isProduction && enableStrictCSP 
    ? `
      default-src 'self';
      script-src 'self' https://apis.google.com https://*.firebaseio.com https://*.firebase.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://*.googleapis.com https://*.gstatic.com;
      font-src 'self';
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
      frame-src 'self' https://*.firebaseauth.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
    : '';
    
  // Load Firebase config from environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  };
  
  return (
    <Html lang="en">
      <Head>
        {/* Content Security Policy */}
        {cspContent && <meta httpEquiv="Content-Security-Policy" content={cspContent} />}
        
        {/* Prevent XSS with these security headers */}
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Prevent clickjacking */}
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        
        {/* Viewport settings for better mobile experience */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* Add runtime configuration scripts */}
        <script src={`${basePath}/runtime-config.js`} />
        <script src={`${basePath}/secure-config.js`} />
        <script src={`${basePath}/direct-url-fix.js`} />
        
        {/* Simplified inline script for basic URL redirection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Simple inline URL fix script
              (function() {
                console.log('Inline URL fix script loaded');
                
                // Store the original fetch function
                const originalFetch = window.fetch;
                
                // Patch fetch to intercept API calls
                window.fetch = function(url, options) {
                  // Skip interception if this request opts out
                  if (options && options.noInterception) {
                    return originalFetch(url, options);
                  }
                  
                  // Handle signals API
                  if (typeof url === 'string' && 
                      (url.includes('/api/signals') || 
                       url.includes('personalsite77.vercel.app/api/signals'))) {
                    
                    console.log('Intercepting signals API call:', url);
                    let debugUrl = '/api/signals-debug';
                    
                    // Pass the query string if any
                    if (url.includes('?')) {
                      try {
                        const urlObj = new URL(url.startsWith('http') ? url : 'http://example.com' + url);
                        debugUrl += urlObj.search;
                      } catch (e) {
                        console.error('Error parsing URL:', e);
                      }
                    }
                    
                    console.log('Redirecting to debug endpoint:', debugUrl);
                    
                    // Create new options that disable further interception
                    const newOptions = { 
                      ...(options || {}),
                      noInterception: true
                    };
                    
                    return originalFetch(debugUrl, newOptions);
                  }
                  
                  // For all other URLs, use the original fetch
                  return originalFetch(url, options);
                };
                
                console.log('Inline URL fix script initialized');
              })();
            `
          }}
        />
        
        {/* Additional fixes only for development */}
        {!isProduction && (
          <>
            <script src={`${basePath}/fix-api-url.js`} />
            <script src={`${basePath}/personalsite/signals-redirect.js`} />
          </>
        )}
        
        {/* Stylesheet */}
        <link 
          rel="stylesheet" 
          href={`${basePath}/styles.css`}
          key="global-styles"
        />
      </Head>
      <body>
        {/* Inline the runtime config at the beginning of the body */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // This is a critical script that must load first
              window.runtimeConfig = {
                firebase: {
                  // Only include project ID, other values will be loaded from environment
                  projectId: "${firebaseConfig.projectId || ''}"
                },
                isProduction: ${isProduction},
                basePath: "${basePath}"
              };
              
              // Also include alternate format for compatibility
              window.__RUNTIME_CONFIG__ = window.runtimeConfig;
            `
          }}
        />
        {/* Simple debug logging script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('Firebase config status:', {
                secure: !!window.SECURE_CONFIG?.firebase?.apiKey,
                runtime: !!window.runtimeConfig?.firebase?.apiKey,
                projectId: window.SECURE_CONFIG?.firebase?.projectId || window.runtimeConfig?.firebase?.projectId || 'unknown'
              });
            `
          }}
        />
        
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
