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
  // If user tries to go to Dashboard OR Contacts without logging in -> Redirect to Login
  if (
    (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/contacts')) 
    && !user
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // Add '/contacts' to the matcher so middleware actually runs on that page
  matcher: ['/dashboard/:path*', '/contacts', '/login'],
}
