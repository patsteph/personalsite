import { NextResponse } from 'next/server';

// Middleware function to protect routes and handle redirects
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  console.log(`Middleware running for path: ${pathname}`);
  
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
  
  // Special handling for blog posts to ensure they work even with prebuild issues
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    // Extract the slug from the pathname
    const slug = pathname.replace('/blog/', '');
    console.log(`Middleware: Processing blog post request for slug "${slug}"`);
    
    // If there's a 404 being returned for the data URL, force a rewrite to SSR
    if (pathname.includes('_next/data') && pathname.includes('.json')) {
      console.log(`Middleware: Handling data request for blog post slug "${slug}"`);
      return NextResponse.rewrite(new URL(`/blog/${slug}`, req.url));
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
    '/blog/:slug*',
    '/_next/data/:build/blog/:slug.json'
  ],
};