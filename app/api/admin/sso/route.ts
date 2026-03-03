import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { logActivity, logAudit } from '@/lib/actions/audit'

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
  const { companyId, entityId, ssoUrl, certificate } = body as {
    companyId: string
    entityId: string
    ssoUrl: string
    certificate: string
  }

  if (!companyId || !entityId || !ssoUrl) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (companyId !== profile?.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('sso_configurations')
    .upsert(
      {
        company_id: companyId,
        entity_id: entityId,
        sso_url: ssoUrl,
        certificate: certificate || null,
        updated_at: new Date().toISOString(),
        created_by: user.id,
      },
      { onConflict: 'company_id' }
    )
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    event_type: 'SSO_CONFIG_UPDATED',
    resource_type: 'sso_configuration',
    resource_id: data.id,
    details: { company_id: companyId },
  })
  await logActivity({
    action: 'update_sso_config',
    resource_type: 'sso_configuration',
    resource_id: data.id,
  })

  return NextResponse.json({ success: true, id: data.id })
}
