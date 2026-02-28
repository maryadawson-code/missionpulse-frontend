'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCompetitor(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const name = formData.get('name') as string
  const threatLevel = formData.get('threatLevel') as string
  const incumbent = formData.get('incumbent') === 'true'
  const pwinEstimate = Number(formData.get('pwinEstimate') ?? 0) || null
  const strengthsRaw = formData.get('strengths') as string
  const weaknessesRaw = formData.get('weaknesses') as string

  const strengths = strengthsRaw
    ? strengthsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : []
  const weaknesses = weaknessesRaw
    ? weaknessesRaw.split('\n').map((w) => w.trim()).filter(Boolean)
    : []

  const competitorId = crypto.randomUUID()
  const { error } = await supabase.from('competitors').insert({
    id: competitorId,
    opportunity_id: opportunityId,
    name,
    threat_level: threatLevel || 'medium',
    incumbent,
    pwin_estimate: pwinEstimate,
    strengths,
    weaknesses,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'add_competitor',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'competitor', entity_id: competitorId, opportunity_id: opportunityId, name },
  })

  revalidatePath(`/pipeline/${opportunityId}/strategy`)
  return { success: true }
}

export async function updateCompetitor(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const competitorId = formData.get('competitorId') as string
  const opportunityId = formData.get('opportunityId') as string
  const likelyStrategy = formData.get('likelyStrategy') as string
  const counterStrategy = formData.get('counterStrategy') as string
  const ghostThemesRaw = formData.get('ghostThemes') as string

  const ghostThemes = ghostThemesRaw
    ? ghostThemesRaw.split('\n').map((t) => t.trim()).filter(Boolean)
    : undefined

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (likelyStrategy) updates.likely_strategy = likelyStrategy
  if (counterStrategy) updates.counter_strategy = counterStrategy
  if (ghostThemes) updates.ghost_themes = ghostThemes

  const { error } = await supabase
    .from('competitors')
    .update(updates)
    .eq('id', competitorId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_competitor',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'competitor', entity_id: competitorId, opportunity_id: opportunityId },
  })

  revalidatePath(`/pipeline/${opportunityId}/strategy`)
  return { success: true }
}

export async function deleteCompetitor(competitorId: string, opportunityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', competitorId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'delete_competitor',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'competitor', entity_id: competitorId, opportunity_id: opportunityId },
  })

  revalidatePath(`/pipeline/${opportunityId}/strategy`)
  return { success: true }
}
