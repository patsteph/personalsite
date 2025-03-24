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
        
        {/* Inline script for critical URL fixes - no external dependencies */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Inline URL fix script that doesn't depend on external files
              (function() {
                console.log('Inline URL fix script loaded');
                
                // Store the original fetch function
                const originalFetch = window.fetch;
                
                // Patch fetch to intercept signals API calls
                window.fetch = function(url, options) {
                  // Check if URL is a signals API call
                  if (typeof url === 'string' && 
                      (url.includes('/api/signals') || 
                       url.includes('personalsite77.vercel.app/api/signals'))) {
                    
                    console.log('Intercepting signals API call:', url);
                    
                    // Create the proxy URL
                    let proxyUrl;
                    
                    if (url.includes('personalsite77.vercel.app')) {
                      // Extract path and query from absolute URL
                      const urlObj = new URL(url);
                      proxyUrl = '/api/signals-proxy' + urlObj.search;
                    } else {
                      // Replace /api/signals with /api/signals-proxy in relative URL
                      proxyUrl = url.replace('/api/signals', '/api/signals-proxy');
                    }
                    
                    console.log('Redirecting API call to:', proxyUrl);
                    
                    // Call with modified URL
                    return originalFetch(proxyUrl, options);
                  }
                  
                  // For all other URLs, use the original fetch
                  return originalFetch(url, options);
                };
                
                // Handle potential redirect to fixed signals admin
                if (window.location.pathname === '/admin/signals') {
                  console.log('Redirecting to fixed signals admin page');
                  window.location.href = '/admin/signals-fixed';
                }
                
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
        {/* Inline script for critical URL fixes in body */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Redirect to fixed signals admin page directly if needed
              if (window.location.pathname === '/admin/signals') {
                console.log('Immediate redirect to fixed signals admin page');
                window.location.href = '/admin/signals-fixed';
              }
              
              // Also set up fetch interception as early as possible
              (function() {
                if (typeof window.fetch === 'function') {
                  const originalFetch = window.fetch;
                  window.fetch = function(url, options) {
                    if (typeof url === 'string' && url.includes('personalsite77.vercel.app/api/signals')) {
                      console.log('Early interception of signals API call, redirecting to proxy');
                      const urlObj = new URL(url);
                      const proxyUrl = '/api/signals-proxy' + urlObj.search;
                      return originalFetch(proxyUrl, options);
                    }
                    return originalFetch(url, options);
                  };
                }
              })();
            `
          }}
        />
        
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
