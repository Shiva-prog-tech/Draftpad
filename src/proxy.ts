import NextAuth from 'next-auth';
import { authConfig } from '@/server/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const isAuthPage  = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
  const isApiAuth   = nextUrl.pathname.startsWith('/api/auth');
  const isInvite    = nextUrl.pathname.startsWith('/invite');
  const isApiInvite = nextUrl.pathname.startsWith('/api/invites');

  // Always allow: auth routes, invite pages, invite API
  if (isApiAuth || isInvite || isApiInvite) return NextResponse.next();

  // Redirect logged-in users away from auth pages
  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', nextUrl));
    return NextResponse.next();
  }

  // Require login for everything else
  if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl));
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
