import { NextRequest, NextResponse } from 'next/server'
import { exchangeSalesforceCode } from '@/lib/integrations/salesforce/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations/salesforce?error=missing_code', request.url)
    )
  }

  const result = await exchangeSalesforceCode(code)

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/integrations/salesforce?error=${encodeURIComponent(result.error ?? 'salesforce_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/integrations/salesforce?connected=true', request.url)
  )
}
