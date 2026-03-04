import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { logActivity } from '@/lib/actions/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canEdit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { companyId, primaryColor, headerText, footerText, logoUrl } = body as {
    companyId: string
    primaryColor: string
    headerText: string
    footerText: string
    logoUrl: string
  }

  if (!companyId) {
    return NextResponse.json(
      { error: 'Missing companyId' },
      { status: 400 }
    )
  }

  if (companyId !== profile?.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('companies')
    .update({
      primary_color: primaryColor || null,
      header_text: headerText || null,
      footer_text: footerText || null,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivity({
    action: 'update_brand_settings',
    resource_type: 'company',
    resource_id: companyId,
  })

  return NextResponse.json({ success: true })
}
