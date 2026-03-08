// filepath: app/api/admin/pilots/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertPilotToAnnual } from '@/lib/billing/pilots'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  const role = resolveRole(profile?.role as string | null)
  if (!hasPermission(role, 'admin', 'canEdit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Verify the pilot belongs to the user's company
  const { data: pilot } = await supabase
    .from('company_subscriptions')
    .select('id')
    .eq('id', id)
    .eq('company_id', profile?.company_id ?? '')
    .single()
  if (!pilot) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { action } = await request.json() as { action: string }
  if (action !== 'convert') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  const result = await convertPilotToAnnual(id)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
