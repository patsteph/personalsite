import { NextResponse } from 'next/server';

// Middleware function to protect routes
export async function middleware(req) {
  // Protect admin routes that are not the login page
  if (req.nextUrl.pathname.startsWith('/admin') && 
      !req.nextUrl.pathname.includes('/admin/login')) {
    
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
  matcher: ['/admin/:path*'],
};