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
    // Check for Supabase auth cookies (they start with sb-)
    const authCookies = req.cookies.getAll()
    const hasAuthCookie = authCookies.some(cookie => 
      cookie.name.startsWith('sb-') && cookie.value && cookie.value.length > 10
    )
    
    // Look for specific auth cookies that indicate a valid session
    const accessTokenCookie = authCookies.find(cookie => 
      cookie.name.includes('access-token') && cookie.value
    )
    const refreshTokenCookie = authCookies.find(cookie => 
      cookie.name.includes('refresh-token') && cookie.value
    )
    
    // If no valid auth cookies found, redirect to login
    if (!hasAuthCookie && !accessTokenCookie && !refreshTokenCookie) {
      console.log('🔒 Middleware: No valid auth cookies found, redirecting to login')
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log('✅ Middleware: Valid auth cookies found, allowing access to', path)
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
