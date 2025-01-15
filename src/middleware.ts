import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /auth/signin or /auth/register,
  // redirect the user to /auth/signin
  if (!session && !['/auth/signin', '/auth/register'].includes(req.nextUrl.pathname)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and the current path is /auth/signin or /auth/register,
  // redirect the user to /dashboard
  if (session && ['/auth/signin', '/auth/register'].includes(req.nextUrl.pathname)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/auth/signin',
    '/auth/register'
  ],
} 