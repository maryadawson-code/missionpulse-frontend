/**
 * OAuth Initiation Route — GET /api/oauth/[provider]
 *
 * Validates provider, authenticates user, generates CSRF state cookie,
 * and redirects to the provider's authorization URL.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizationUrl, OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/integrations/oauth-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    return NextResponse.json(
      { error: `Invalid provider: ${provider}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Generate CSRF state
  const state = crypto.randomBytes(32).toString('hex')

  // Store state + userId in httpOnly cookie (10-minute TTL)
  const cookieStore = await cookies()
  cookieStore.set(`oauth_state_${provider}`, JSON.stringify({ state, userId: user.id }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const authUrl = await buildAuthorizationUrl(provider as OAuthProvider, state, baseUrl)

  return NextResponse.redirect(authUrl)
}
