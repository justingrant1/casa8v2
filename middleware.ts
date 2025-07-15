import { createClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)

    // This will refresh the session if expired
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
        console.log(
          `[Middleware] No user found for protected route: ${path}. Redirecting to login.`
        )
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', path)
        return NextResponse.redirect(redirectUrl)
      }

      // User is authenticated, now check role for specific routes
      if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (error || !profile) {
            console.error(
              `[Middleware] Error fetching profile for user ${user.id}:`,
              error
            )
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('error', 'profile_fetch_failed')
            return NextResponse.redirect(redirectUrl)
          }

          if (path.startsWith('/dashboard') && profile.role !== 'landlord') {
            console.log(
              `[Middleware] User ${user.id} with role '${profile.role}' tried to access landlord dashboard. Redirecting.`
            )
            return NextResponse.redirect(new URL('/', request.url))
          }

          if (path.startsWith('/admin') && profile.role !== 'admin') {
            console.log(
              `[Middleware] User ${user.id} with role '${profile.role}' tried to access admin page. Redirecting.`
            )
            return NextResponse.redirect(new URL('/', request.url))
          }
        } catch (e) {
          console.error('[Middleware] Exception during profile fetch:', e)
          const redirectUrl = new URL('/login', request.url)
          redirectUrl.searchParams.set('error', 'middleware_exception')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }

    // If all checks pass, return the response from the client, which may have updated cookies
    return response
  } catch (e) {
    // Catch any other unexpected errors in the middleware
    console.error('[Middleware] Top-level exception:', e)
    // Return a generic error response, but avoid another redirect loop
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
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
