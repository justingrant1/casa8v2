import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Define routes that require authentication (basic check)
  const protectedRoutes = [
    '/dashboard',
    '/list-property', 
    '/admin',
    '/messages',
    '/favorites',
    '/profile',
    '/settings'
  ]
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  if (isProtectedRoute) {
    // Check for basic auth indicators in cookies
    const hasAuthCookie = req.cookies.has('sb-access-token') || 
                         req.cookies.has('sb-refresh-token') ||
                         req.cookies.has('supabase-auth-token')
    
    // If no auth cookies found, redirect to login
    if (!hasAuthCookie) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Let client-side auth handle role-based access control
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/list-property/:path*',
    '/admin/:path*',
    '/messages/:path*',
    '/favorites/:path*',
    '/profile/:path*',
    '/settings/:path*'
  ]
}
