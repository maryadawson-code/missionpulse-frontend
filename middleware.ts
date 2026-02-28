/**
 * MissionPulse Middleware
 * Refreshes Supabase session on every request.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users away from auth pages.
 * © 2026 Mission Meets Tech
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth/callback', '/api/health', '/plans', '/8a-toolkit', '/api/newsletter', '/robots.txt', '/sitemap.xml', '/mfa']

// Auth pages that authenticated users should be redirected away from
const AUTH_ONLY_ROUTES = ['/login', '/signup', '/forgot-password']

// Redis-backed rate limiting (replaces in-memory Map)
import {
  checkRateLimit,
  rateLimitHeaders,
  getTierForRoute,
  isAllowlisted,
} from '@/lib/security/rate-limiter'
import { createLogger } from '@/lib/logging/logger'
import { checkBruteForce } from '@/lib/security/brute-force'

const log = createLogger('middleware')

function isLandingPage(pathname: string): boolean {
  return pathname === '/'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Generate correlation ID for request tracing
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  request.headers.set('x-request-id', requestId)

  // Landing page is public for everyone
  if (isLandingPage(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-request-id', requestId)
    return response
  }

  // Redis-backed rate limiting for API routes and auth endpoints
  const tier = getTierForRoute(pathname)
  if (tier) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!isAllowlisted(ip)) {
      const result = await checkRateLimit(`${ip}:${pathname}`, tier)
      if (!result.success) {
        log.warn('Rate limit exceeded', { ip, pathname, tier })
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: rateLimitHeaders(result) }
        )
      }
    }
  }
  // Brute force protection for auth endpoints
  if (pathname === '/login' || pathname === '/signup') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    // Extract email from form body on POST (brute force only applies to login attempts)
    if (request.method === 'POST') {
      try {
        const cloned = request.clone()
        const formData = await cloned.formData().catch(() => null)
        const email = formData?.get('email')?.toString() ?? ''
        if (email) {
          const bf = await checkBruteForce(ip, email)
          if (!bf.allowed) {
            log.warn('Brute force block', { ip, reason: bf.reason })
            return NextResponse.json(
              { error: 'Too many failed attempts. Please try again later.' },
              { status: 429, headers: bf.lockoutExpiresAt ? { 'Retry-After': String(bf.lockoutExpiresAt - Math.floor(Date.now() / 1000)) } : {} }
            )
          }
          // Progressive delay
          if (bf.delayMs && bf.delayMs > 0) {
            await new Promise((r) => setTimeout(r, bf.delayMs))
          }
        }
      } catch {
        // Non-blocking: form parsing may fail for non-form requests
      }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // If env vars are missing, let public routes through and block protected ones
  if (!supabaseUrl || !supabaseKey) {
    const pathname = request.nextUrl.pathname
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Unauthenticated user trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user trying to access auth-only pages → send to dashboard
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))
  if (user && isAuthOnlyRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - Phase 1 HTML files (*.html)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js|css)$).*)',
  ],
}
