export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/guides/:path*',
    '/api/members/:path*',
    '/api/upload/:path*'
  ]
}
