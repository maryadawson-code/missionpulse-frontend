/**
 * OAuth Callback Route — GET /api/oauth/[provider]/callback
 *
 * Receives ?code=&state= from the provider. Validates CSRF state,
 * exchanges code for tokens, fetches user info, stores in user_oauth_tokens.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  OAUTH_PROVIDERS,
  exchangeCodeForTokens,
  fetchProviderUserInfo,
  upsertUserToken,
  type OAuthProvider,
} from '@/lib/integrations/oauth-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const integrationsUrl = new URL('/integrations', request.url)

  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    integrationsUrl.searchParams.set('error', `Invalid provider: ${provider}`)
    return NextResponse.redirect(integrationsUrl)
  }

  const typedProvider = provider as OAuthProvider
  const code = request.nextUrl.searchParams.get('code')
  const returnedState = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  // Provider returned an error (e.g. user denied consent)
  if (error) {
    integrationsUrl.searchParams.set('error', `${provider}: ${error}`)
    return NextResponse.redirect(integrationsUrl)
  }

  if (!code || !returnedState) {
    integrationsUrl.searchParams.set('error', 'Missing code or state parameter')
    return NextResponse.redirect(integrationsUrl)
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const cookieName = `oauth_state_${provider}`
  const stateCookie = cookieStore.get(cookieName)

  if (!stateCookie?.value) {
    integrationsUrl.searchParams.set('error', 'Missing state cookie — session may have expired')
    return NextResponse.redirect(integrationsUrl)
  }

  let storedState: { state: string; userId: string }
  try {
    storedState = JSON.parse(stateCookie.value) as { state: string; userId: string }
  } catch {
    integrationsUrl.searchParams.set('error', 'Invalid state cookie')
    return NextResponse.redirect(integrationsUrl)
  }

  // Delete the cookie regardless of outcome
  cookieStore.delete(cookieName)

  if (returnedState !== storedState.state) {
    integrationsUrl.searchParams.set('error', 'State mismatch — possible CSRF attack')
    return NextResponse.redirect(integrationsUrl)
  }

  // Exchange code for tokens
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin

  try {
    const tokens = await exchangeCodeForTokens(typedProvider, code, baseUrl)

    // Fetch provider user info
    const userInfo = await fetchProviderUserInfo(typedProvider, tokens.accessToken)

    // For Slack, email might be in the raw response
    let providerEmail = userInfo.email
    if (typedProvider === 'slack' && !providerEmail) {
      const authedUser = tokens.rawResponse.authed_user as Record<string, unknown> | undefined
      providerEmail = (authedUser?.email as string) ?? null
    }

    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : null

    await upsertUserToken({
      userId: storedState.userId,
      provider: typedProvider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      scope: tokens.scope,
      providerUserId: userInfo.userId,
      providerEmail,
    })

    integrationsUrl.searchParams.set('connected', provider)
    return NextResponse.redirect(integrationsUrl)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed'
    integrationsUrl.searchParams.set('error', message)
    return NextResponse.redirect(integrationsUrl)
  }
}
