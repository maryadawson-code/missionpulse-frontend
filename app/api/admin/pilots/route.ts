// filepath: app/api/admin/pilots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPilot, listPilots } from '@/lib/billing/pilots'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'executive') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const pilots = await listPilots()
  return NextResponse.json({ pilots })
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { companyId: string; planId: string; pilotKpi: string; adminNote?: string }
  const result = await createPilot(body)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
