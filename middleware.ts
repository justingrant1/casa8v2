import { createClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/list-property',
    '/admin',
    '/messages',
    '/favorites',
    '/profile',
    '/settings',
  ]

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  )

  if (isProtectedRoute) {
    if (!user) {
      // If no user, redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    } else {
      // If there is a user, check their role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        // Handle error or missing profile
        console.error('Error fetching profile in middleware:', error)
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'profile_not_found')
        return NextResponse.redirect(redirectUrl)
      }

      // Role-based access control
      if (path.startsWith('/dashboard') && profile.role !== 'landlord') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      if (path.startsWith('/admin') && profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
