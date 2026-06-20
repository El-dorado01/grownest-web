// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  // Route affiliate subdomain to affiliate-portal directory
  if (hostname.startsWith('affiliate.')) {
    const url = request.nextUrl.clone();
    const currentPath = url.pathname;

    if (!currentPath.startsWith('/affiliate-portal')) {
      url.pathname = currentPath === '/' ? '/affiliate-portal' : `/affiliate-portal${currentPath}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
