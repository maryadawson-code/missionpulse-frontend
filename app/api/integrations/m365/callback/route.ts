import { NextRequest, NextResponse } from 'next/server'
import { exchangeM365Code } from '@/lib/integrations/m365/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations/m365?error=missing_code', request.url)
    )
  }

  const result = await exchangeM365Code(code)

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/integrations/m365?error=${encodeURIComponent(result.error ?? 'm365_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/integrations/m365?connected=true', request.url)
  )
}
