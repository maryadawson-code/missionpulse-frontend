import { NextRequest, NextResponse } from 'next/server'
import { exchangeGovWinCode } from '@/lib/integrations/govwin/client'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations/govwin?error=missing_code', request.url)
    )
  }

  const result = await exchangeGovWinCode(code)

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/integrations/govwin?error=${encodeURIComponent(result.error ?? 'govwin_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/integrations/govwin?connected=true', request.url)
  )
}
