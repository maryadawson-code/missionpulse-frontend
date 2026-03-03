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
  const { companyId, name, description, permissions } = body as {
    companyId: string
    name: string
    description: string
    permissions: Record<string, string>
  }

  if (!companyId || !name) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (companyId !== profile?.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('custom_roles')
    .insert({
      role_name: name.toLowerCase().replace(/\s+/g, '_'),
      display_name: name,
      description: description || null,
      module_permissions: permissions,
      organization_id: companyId,
      base_role: 'custom',
      created_by: user.id,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    event_type: 'CUSTOM_ROLE_CREATED',
    resource_type: 'custom_role',
    resource_id: data.id,
    details: { role_name: name, company_id: companyId },
  })
  await logActivity({
    action: 'create_custom_role',
    resource_type: 'custom_role',
    resource_id: data.id,
    details: { role_name: name },
  })

  return NextResponse.json({ success: true, id: data.id })
}
