'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordOutcome(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const outcome = formData.get('outcome') as string

  const { error } = await supabase
    .from('opportunities')
    .update({ status: outcome, updated_at: new Date().toISOString() })
    .eq('id', opportunityId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    action: 'outcome_recorded',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    details: { outcome },
    created_at: new Date().toISOString(),
  })

  revalidatePath(`/pipeline/${opportunityId}/post-award`)
  return { success: true }
}

export async function saveDebrief(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const outcome = formData.get('outcome') as string
  const strengthsRaw = formData.get('strengths') as string
  const weaknessesRaw = formData.get('weaknesses') as string
  const evaluatorFeedback = formData.get('evaluatorFeedback') as string
  const notes = formData.get('notes') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('title, ceiling')
    .eq('id', opportunityId)
    .single()

  const strengths = strengthsRaw
    ? strengthsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : []
  const weaknesses = weaknessesRaw
    ? weaknessesRaw.split('\n').map((w) => w.trim()).filter(Boolean)
    : []

  const { error } = await supabase.from('debriefs').insert({
    id: crypto.randomUUID(),
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    created_by: user.id,
    opportunity_name: opp?.title ?? '',
    outcome,
    contract_value: opp?.ceiling ?? null,
    debrief_date: new Date().toISOString(),
    debrief_type: 'formal',
    strengths,
    weaknesses,
    evaluator_feedback: evaluatorFeedback ? { text: evaluatorFeedback } : null,
    notes,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/pipeline/${opportunityId}/post-award`)
  return { success: true }
}

export async function addLessonLearned(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const opportunityId = formData.get('opportunityId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const recommendation = formData.get('recommendation') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase.from('lessons_learned').insert({
    id: crypto.randomUUID(),
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    created_by: user.id,
    title,
    description,
    category: category || 'general',
    recommendation,
    lesson_type: 'post_award',
    outcome: formData.get('outcome') as string,
    tags: ['Post-Award'],
  })

  if (error) return { success: false, error: error.message }

  // Also add to playbook
  await supabase.from('playbook_entries').insert({
    id: crypto.randomUUID(),
    created_by: user.id,
    title: `Lesson: ${title}`,
    user_prompt: description ?? '',
    assistant_response: `Recommendation: ${recommendation ?? 'No recommendation provided.'}`,
    category: 'lessons_learned',
    keywords: ['Post-Award', category || 'general'],
    quality_rating: '3',
  })

  revalidatePath(`/pipeline/${opportunityId}/post-award`)
  return { success: true }
}
