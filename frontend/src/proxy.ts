import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/reset-password', '/plp-logo.png'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if requested route is public/static
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith('/_next') || pathname.includes('.')
  );

  // Check for session cookies
  const token = request.cookies.get('token')?.value;
  const userType = request.cookies.get('userType')?.value;

  console.log(`[PROXY] Path: ${pathname}, Token: ${!!token}, UserType: ${userType}`);

  // Handle Public Routes
  if (isPublicRoute) {
    // If user is already logged in AND has a known role, redirect away from login/register
    if (token && userType && (pathname === '/login' || pathname === '/register')) {
      let dest = '/dashboard/alumni';
      if (userType === 'ADMIN') dest = '/dashboard/admin';
      if (userType === 'STAFF') dest = '/dashboard/faculty';
      if (userType === 'USER') dest = '/dashboard/alumni';
      console.log(`[PROXY] Public -> Private Redirect: ${dest}`);
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Handle Private Routes
  if (!token) {
    console.log(`[PROXY] Unauthenticated -> Login Redirect`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- ROLE-BASED ACCESS CONTROL (RBAC) ---
  
  // If we have a token but NO userType, we can't enforce RBAC safely.
  if (!userType) {
    console.log(`[PROXY] Missing Role -> Login Redirect (Clearing Token)`);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  if (userType === 'ADMIN') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard/faculty')) {
    if (userType !== 'STAFF') {
      const dest = userType === 'USER' ? '/dashboard/alumni' : '/login';
      console.log(`[PROXY] RBAC Violation (Faculty) -> ${dest}`);
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname.startsWith('/dashboard/alumni')) {
    if (userType !== 'USER') {
      const dest = userType === 'STAFF' ? '/dashboard/faculty' : '/login';
      console.log(`[PROXY] RBAC Violation (Alumni) -> ${dest}`);
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (pathname.startsWith('/dashboard/admin')) {
    if (userType !== 'ADMIN') {
      const dest = userType === 'STAFF' ? '/dashboard/faculty' : '/dashboard/alumni';
      console.log(`[PROXY] RBAC Violation (Admin) -> ${dest}`);
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
