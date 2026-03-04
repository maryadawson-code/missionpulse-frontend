import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeGoogleCode } from '@/lib/integrations/google/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations/google?error=missing_code', request.url)
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=session_expired', request.url)
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const result = await exchangeGoogleCode(code, user.id, profile?.company_id ?? '')

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/integrations/google?error=${encodeURIComponent(result.error ?? 'google_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/integrations/google?connected=true', request.url)
  )
}
