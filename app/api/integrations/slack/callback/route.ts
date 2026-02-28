import { NextRequest, NextResponse } from 'next/server'
import { exchangeSlackCode } from '@/lib/integrations/slack/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/integrations?error=missing_code', request.url)
    )
  }

  const result = await exchangeSlackCode(code)

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/admin/integrations?error=${encodeURIComponent(result.error ?? 'slack_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/admin/integrations?connected=slack', request.url)
  )
}
