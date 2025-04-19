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
      script-src 'self' https://apis.google.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://*.googleapis.com https://*.gstatic.com;
      font-src 'self';
      connect-src 'self' https://*.googleapis.com;
      frame-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
    : '';
  
  return (
    <Html lang="en">
      <Head>
        {/* Content Security Policy */}
        {cspContent && <meta httpEquiv="Content-Security-Policy" content={cspContent} />}
        
        {/* Prevent XSS with these security headers */}
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Add runtime configuration scripts with proper async/defer attributes */}
        <script src={`${basePath}/runtime-config.js`} async />
        
        {/* Stylesheet */}
        <link 
          rel="stylesheet" 
          href={`${basePath}/styles.css`}
          key="global-styles"
        />
      </Head>
      <body>
        {/* Inline the runtime config at the beginning of the body - minimal version */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Minimal runtime config without sensitive data
              window.runtimeConfig = {
                isProduction: ${isProduction},
                basePath: "${basePath}"
              };
              
              // Also include alternate format for compatibility
              window.__RUNTIME_CONFIG__ = window.runtimeConfig;
            `
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}