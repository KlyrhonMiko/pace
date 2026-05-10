import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/reset-password', '/plp-logo.png', '/maintenance'];

function hasSession(request: NextRequest): boolean {
  return !!request.cookies.get('pace_session')?.value;
}

function getRole(request: NextRequest): string | undefined {
  return request.cookies.get('pace_role')?.value;
}

function getDashboardForRole(userType: string | undefined): string {
  switch (userType) {
    case 'ADMIN': return '/dashboard/admin';
    case 'STAFF': return '/dashboard/faculty';
    case 'EMPLOYER': return '/dashboard/employer';
    case 'USER': return '/dashboard/alumni';
    default: return '/dashboard/alumni';
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    /\.(.*)$/.test(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('/public/') ||
    pathname.startsWith('/surveys/') ||
    pathname === '/plp-logo.png';

  if (isPublicRoute) {
    if (hasSession(request) && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL(getDashboardForRole(getRole(request)), request.url));
    }

    if (!hasSession(request) && pathname === '/login') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('login', 'true');
      const redirectTarget = request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('from');
      if (redirectTarget) {
        homeUrl.searchParams.set('redirect', redirectTarget);
      }
      return NextResponse.redirect(homeUrl);
    }

    if (!hasSession(request) && pathname === '/register') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('register', 'Alumni');
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }

  if (!hasSession(request)) {
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('login', 'true');
    homeUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(homeUrl);
  }

  const role = getRole(request);
  if (!role) {
    if (pathname.startsWith("/dashboard/")) {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("login", "true");
      if (hasSession(request)) {
        homeUrl.searchParams.set("force", "true");
      }
      return NextResponse.redirect(homeUrl);
    }
    if (hasSession(request) && (pathname === "/login" || pathname === "/register")) {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("login", "true");
      homeUrl.searchParams.set("force", "true");
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  if (role === 'ADMIN') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard/faculty') && role !== 'STAFF') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  if (pathname.startsWith('/dashboard/alumni') && role !== 'USER') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  if (pathname.startsWith('/dashboard/employer') && role !== 'EMPLOYER') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo\\.png|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
};
