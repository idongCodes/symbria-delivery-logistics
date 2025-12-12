import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Attempt to use @supabase/auth-helpers-nextjs middleware client when available.
// Fallback to simple cookie-name check if helpers aren't installed.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.[a-zA-Z0-9]+$/)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    try {
      // dynamic import so app still builds if package isn't installed yet
      const mod = await import('@supabase/auth-helpers-nextjs');
      const { createMiddlewareSupabaseClient } = mod;
      const res = NextResponse.next();
      const supabase = createMiddlewareSupabaseClient({ req, res });
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      return res;
    } catch {
      // fallback cookie check
      const cookieCandidates = [
        req.cookies.get('sb-access-token'),
        req.cookies.get('supabase-auth-token'),
        req.cookies.get('sb:token'),
        req.cookies.get('session'),
      ];

      const hasToken = cookieCandidates.some((c) => Boolean(c?.value));

      if (!hasToken) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
