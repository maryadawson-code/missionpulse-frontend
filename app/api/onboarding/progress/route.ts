// filepath: app/api/onboarding/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress, saveOnboardingProgress, completeOnboarding } from '@/lib/onboarding/progress'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const progress = await getOnboardingProgress(user.id)
  return NextResponse.json(progress)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const body = await request.json() as { step: number; action: 'complete' | 'skip' }
  await saveOnboardingProgress(user.id, body.step, body.action === 'skip')
  if (body.step >= 5) await completeOnboarding(user.id)
  return NextResponse.json({ success: true })
}
