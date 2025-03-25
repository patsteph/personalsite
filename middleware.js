import { NextResponse } from 'next/server';

// Middleware function to protect routes and handle admin redirects
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const fullUrl = req.url;
  
  // Intercept signals API requests
  if (pathname === '/api/signals') {
    console.log('Middleware: Intercepting signals API request', { 
      pathname, 
      method: req.method,
      url: fullUrl
    });
    
    // Check if it's a Vercel domain or hardcoded URL
    const host = req.headers.get('host');
    const referer = req.headers.get('referer');
    const origin = req.headers.get('origin');
    
    // Log debugging information
    console.log('Middleware headers:', { host, referer, origin });
    
    // Rewrite to the simple API endpoint
    return NextResponse.rewrite(new URL('/api/signals-simple', req.url));
  }
  
  // Redirect legacy admin HTML pages to the React-based admin
  if (pathname === '/admin-login.html') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  
  if (pathname === '/admin-dashboard.html') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }
  
  // Protect admin routes that are not the login page
  if (pathname.startsWith('/admin') && 
      !pathname.includes('/admin/login')) {
    
    // Check for the auth session cookie
    const authCookie = req.cookies.get('auth_session');
    const sessionStorageAuth = req.cookies.get('auth_success');
    
    // Redirect to login if no auth cookie found
    if (!authCookie && !sessionStorageAuth) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*', 
    '/admin-login.html', 
    '/admin-dashboard.html',
    '/api/signals'
    // '/api/books' is not intercepted by middleware
  ],
};