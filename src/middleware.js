import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null)
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/members/:path*',
    '/api/upload/:path*',
    '/api/account/:path*'
  ]
}
