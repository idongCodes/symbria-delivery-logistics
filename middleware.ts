import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // --- 🔒 PROTECTED ROUTES ---
  // Only protect specific routes. The landing page "/" is public by default.
  if (
    (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/dashboard')) 
    && !user
  ) {
    // Redirect unauthenticated users to the Login page, NOT the landing page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users trying to access the public driver trip-log to the admin dashboard
  if (request.nextUrl.pathname === '/trip-log' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/trip-log/:path*', '/dashboard/:path*', '/admin/:path*', '/login', '/share/:path*'],
}