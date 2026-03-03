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
  const { companyId, retentionDays } = body as {
    companyId: string
    retentionDays: number
  }

  if (!companyId || !retentionDays) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (companyId !== profile?.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const validOptions = [90, 180, 365, 730, 1095, 1825, 2555]
  if (!validOptions.includes(retentionDays)) {
    return NextResponse.json(
      { error: 'Invalid retention period' },
      { status: 400 }
    )
  }

  // Read current features, merge in the new retention value
  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const existing =
    typeof company?.features === 'object' && company.features !== null && !Array.isArray(company.features)
      ? company.features
      : {}
  const updated = { ...existing, audit_retention_days: retentionDays }

  const { error } = await supabase
    .from('companies')
    .update({
      features: updated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    event_type: 'AUDIT_RETENTION_UPDATED',
    resource_type: 'company',
    resource_id: companyId,
    details: { retention_days: retentionDays },
  })
  await logActivity({
    action: 'update_audit_retention',
    resource_type: 'company',
    resource_id: companyId,
    details: { retention_days: retentionDays },
  })

  return NextResponse.json({ success: true })
}
