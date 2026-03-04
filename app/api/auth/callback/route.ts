/**
 * Auth Callback Route
 * Handles Supabase auth redirects (email confirm, password reset, OAuth)
 * © 2026 Mission Meets Tech
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Prevent open redirect: next must be a relative path, not a protocol-relative URL
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/'
  }

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, _options: CookieOptions) {
            cookieStore.set({ name, value, ..._options })
          },
          remove(name: string, _options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
