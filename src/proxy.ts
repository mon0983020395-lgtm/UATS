import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123')

// Paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files, next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') || 
    publicPaths.includes(pathname)
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_token')?.value

  // Protect all other routes
  if (!token) {
    // If it's an API route, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    // Otherwise redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    // Token is invalid/expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    response.cookies.delete('admin_token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
