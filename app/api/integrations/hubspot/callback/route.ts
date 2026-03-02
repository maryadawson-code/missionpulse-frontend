import { NextRequest, NextResponse } from 'next/server'
import { exchangeHubSpotCode } from '@/lib/integrations/hubspot/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations/hubspot?error=missing_code', request.url)
    )
  }

  const result = await exchangeHubSpotCode(code)

  if (!result.success) {
    return NextResponse.redirect(
      new URL(
        `/integrations/hubspot?error=${encodeURIComponent(result.error ?? 'hubspot_auth_failed')}`,
        request.url
      )
    )
  }

  return NextResponse.redirect(
    new URL('/integrations/hubspot?connected=true', request.url)
  )
}
