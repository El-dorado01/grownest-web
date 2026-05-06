import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // If visiting the root and no token is present, redirect to login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is already authenticated and tries to visit login/signup, redirect to home
  // Exception: /login/verify is allowed during the 2FA flow (temp token, not full auth)
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/login/verify', '/signup'],
}
