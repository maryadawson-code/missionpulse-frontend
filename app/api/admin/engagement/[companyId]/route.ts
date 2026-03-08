// filepath: app/api/admin/engagement/[companyId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateEngagementScore } from '@/lib/billing/engagement'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  const role = resolveRole(profile?.role as string | null)
  if (!hasPermission(role, 'admin', 'canEdit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Scope to user's own company
  if (profile?.company_id !== companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const score = await calculateEngagementScore(companyId)
  return NextResponse.json(score)
}
