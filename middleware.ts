import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const LOCALES = ['en', 'ko'];
const defaultLocale = 'ko';
const JWT_SECRET = process.env.JWT_SECRET;

const publicApiRoutes = [
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/_vercel') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.includes('/admin/response')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    if (!JWT_SECRET) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Server error: JWT secret missing.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized: No token.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    try {
      const key = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, key);
      return NextResponse.next();
    } catch {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized: Invalid or expired token.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // i18n 처리
  const hasLocale = LOCALES.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (hasLocale) {
    return NextResponse.next();
  }

  const newPathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(new URL(newPathname, request.url));
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|_vercel|.+\\..*).*)',
  ],
};
