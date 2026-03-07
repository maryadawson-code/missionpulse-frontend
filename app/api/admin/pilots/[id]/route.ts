// filepath: app/api/admin/pilots/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertPilotToAnnual } from '@/lib/billing/pilots'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'executive') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { action } = await request.json() as { action: string }
  if (action !== 'convert') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  const result = await convertPilotToAnnual(id)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
