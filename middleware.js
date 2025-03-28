import { NextResponse } from 'next/server';

// Middleware function to protect routes and handle admin redirects
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  
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
    '/admin-dashboard.html'
  ],
};