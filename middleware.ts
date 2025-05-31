import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/admin/login';
  
  // Check if the path is for admin routes (but not login)
  const isAdminPath = path.startsWith('/admin') && !isPublicPath;
  
  // Get the token from the cookies
  const token = request.cookies.get('admin-token')?.value || '';
  
  console.log(`Middleware running for path: ${path}`);
  console.log(`Is admin path: ${isAdminPath}, Is public path: ${isPublicPath}`);
  console.log(`Token exists: ${token ? 'Yes' : 'No'}`);
  
  // If trying to access admin routes without a token, redirect to login
  if (isAdminPath && (!token || token.length === 0)) {
    console.log('Redirecting to login page: no valid token found');
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  // If trying to access login page with a valid token, redirect to admin dashboard
  if (isPublicPath && token && token.length > 0) {
    console.log('Redirecting to admin dashboard: already logged in');
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // If trying to access /admin root with a valid token, redirect to dashboard
  if (path === '/admin' && token && token.length > 0) {
    console.log('Redirecting from /admin to /admin/dashboard');
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  console.log('Proceeding with request');
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/admin/:path*']
};
