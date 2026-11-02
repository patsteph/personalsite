import { NextRequest, NextResponse } from 'next/server';
import { FB_TOKEN_COOKIE_NAME } from './lib/utils/cookies';

// Configuration
const DEBUG_MIDDLEWARE = process.env.NODE_ENV === 'development';

/**
 * Debug logger - only logs in development mode
 * @param message Message to log
 * @param data Optional data to include in log
 */
function debugLog(message: string, data?: any): void {
  if (DEBUG_MIDDLEWARE) {
    if (data) {
      console.log(`Middleware: ${message}`, data);
    } else {
      console.log(`Middleware: ${message}`);
    }
  }
}

/**
 * Middleware function to protect routes and handle redirects
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  debugLog(`Processing request for: ${pathname}`);
  
  try {
    // Handle legacy redirects
    if (pathname === '/admin-login.html') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    if (pathname === '/admin-dashboard.html') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    
    // Protect admin routes that are not the login page.
    //
    // This is a fast, UX-level redirect only: Next.js Edge middleware can't
    // run the Firebase Admin SDK, so it can't cryptographically verify a
    // session here. It checks for the presence of a real Firebase ID token
    // cookie (fb_token, set by the client right after a verified Firebase
    // sign-in) rather than the old unsigned 'auth_success' flag, which any
    // visitor could set themselves to pass this check. The actual
    // authorization boundary is server-side: getServerSideProps pages use
    // withAuth (lib/api/with-auth.ts), and admin API routes verify the
    // token via the Firebase Admin SDK (lib/api/server-auth.ts). A request
    // that gets past this middleware without a valid token still gets 401s
    // from every admin API call.
    if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
      const fbTokenCookie = req.cookies.get(FB_TOKEN_COOKIE_NAME);

      debugLog(`Auth cookie check for ${pathname}: ${fbTokenCookie ? 'Found' : 'Not found'}`);

      // Redirect to login if the token cookie is not found
      if (!fbTokenCookie) {
        debugLog('Unauthorized access attempt, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }

      debugLog('Authorized access granted');
    }
    
    // Special handling for blog posts to ensure they work with prebuild issues
    if (pathname.startsWith('/blog/') && pathname !== '/blog') {
      const slug = pathname.replace('/blog/', '');
      
      // Handle data URL rewrites for blog posts
      if (pathname.includes('_next/data') && pathname.includes('.json')) {
        debugLog(`Handling data request for blog post: ${slug}`);
        return NextResponse.rewrite(new URL(`/blog/${slug}`, req.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Log errors even in production for middleware issues
    console.error('Middleware error:', error);
    
    // Default to allowing the request through in case of errors
    // This is safer than potentially locking users out due to middleware errors
    return NextResponse.next();
  }
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: [
    '/admin/:path*', 
    '/admin-login.html', 
    '/admin-dashboard.html',
    '/blog/:slug*',
    '/_next/data/:build/blog/:slug.json'
  ],
};
