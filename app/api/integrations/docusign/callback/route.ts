import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeDocuSignCode } from '@/lib/integrations/docusign/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/integrations?error=missing_code', request.url)
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

  const result = await exchangeDocuSignCode(code, user.id, profile?.company_id ?? '')

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/admin/integrations?error=${encodeURIComponent(result.error ?? 'docusign_auth_failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/admin/integrations?connected=docusign', request.url)
  )
}
