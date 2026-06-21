// middleware.ts
// Subdomain routing: requests to affiliate.* are rewritten to /affiliate-portal/*
// so the same Next.js app serves both the main site and the affiliate portal.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  // Route affiliate subdomain to the affiliate-portal app directory
  if (hostname.startsWith('affiliate.')) {
    const url = request.nextUrl.clone();
    const currentPath = url.pathname;

    // Avoid double-rewriting paths already under /affiliate-portal
    if (!currentPath.startsWith('/affiliate-portal')) {
      url.pathname =
        currentPath === '/' ? '/affiliate-portal' : `/affiliate-portal${currentPath}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
