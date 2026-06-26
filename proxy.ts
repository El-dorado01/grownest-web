import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''

  // Route affiliate subdomain to affiliate-portal directory
  if (hostname.startsWith('affiliate.')) {
    const url = request.nextUrl.clone()
    const currentPath = url.pathname

    // Let auth routes pass through unchanged — /auth/callback must hit the real route
    const isAuthPath = currentPath.startsWith('/auth/') || currentPath.startsWith('/login') || currentPath.startsWith('/signup')
    if (!isAuthPath && !currentPath.startsWith('/affiliate-portal')) {
      url.pathname = currentPath === '/' ? '/affiliate-portal' : `/affiliate-portal${currentPath}`
      return NextResponse.rewrite(url)
    }
  }

  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Define public paths that bypass authentication check.
  // Affiliate-portal paths are included because the proxy may evaluate them
  // after the subdomain rewrite runs on a subsequent internal request.
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/affiliate-portal')

  // If there's no auth token and path is private, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    // Keep track of redirect path to send user back after login
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // If user is already authenticated and tries to visit login/signup (but not verify pages), redirect to home
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    if (!pathname.startsWith('/login/verify') && !pathname.startsWith('/signup/verify')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (logos, background images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|d_icon\\.png|logo\\.png|social-preview\\.png|bg-image-|undraw_|.*\\.svg$|.*\\.png$|.*\\.jpe?g$|.*\\.webp$).*)',
  ],
}
