import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from './lib/utils/cookies';

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
    
    // Protect admin routes that are not the login page
    if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
      // Check for the auth session cookie
      const sessionStorageAuth = req.cookies.get(AUTH_COOKIE_NAME);
      
      debugLog(`Auth cookie check for ${pathname}: ${sessionStorageAuth ? 'Found' : 'Not found'}`);
      
      // Redirect to login if the auth cookie is not found
      if (!sessionStorageAuth) {
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
