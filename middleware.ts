import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Skip middleware for next internal files, APIs, favicon, and auth callbacks
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // matches favicon.ico, logo images, etc.
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // 2. Setup Headers (we pass x-url to RootLayout to know the original page route)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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

  // 3. Routing Logic:
  // Allow "/under-construction" itself
  if (pathname === '/under-construction') {
    return response;
  }

  // Handle "/admin" routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (user) {
        // Logged in admin visiting login -> redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return response;
    }

    // Protect all other admin routes
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return response;
  }

  // 4. Hide all other routes (/, /dashboard, /trip-log, /login, /contacts, etc.) behind Under Construction
  requestHeaders.set('x-under-construction', 'true');
  return NextResponse.rewrite(new URL('/under-construction', request.url), {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for Next.js internals, API, and static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}