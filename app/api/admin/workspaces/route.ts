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
  const { parentCompanyId, name, domain } = body as {
    parentCompanyId: string
    name: string
    domain: string
  }

  if (!parentCompanyId || !name) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (parentCompanyId !== profile?.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      parent_company_id: parentCompanyId,
      name,
      domain: domain || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    event_type: 'WORKSPACE_CREATED',
    resource_type: 'workspace',
    resource_id: data.id,
    details: { name, parent_company_id: parentCompanyId },
  })
  await logActivity({
    action: 'create_workspace',
    resource_type: 'workspace',
    resource_id: data.id,
    details: { name },
  })

  return NextResponse.json({ success: true, id: data.id })
}
