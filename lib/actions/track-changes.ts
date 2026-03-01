'use server'

import { createClient } from '@/lib/supabase/server'

interface PersistSuggestionDecisionParams {
  suggestionId: string
  decision: 'accepted' | 'rejected'
  sectionId: string
  opportunityId: string
  content: string
  confidence: 'high' | 'medium' | 'low'
  modelAttribution: string
}

/**
 * Persist an AI suggestion accept/reject decision to activity_feed and audit_logs.
 * Fire-and-forget — callers should not await this.
 */
export async function persistSuggestionDecision({
  suggestionId,
  decision,
  sectionId,
  opportunityId,
  content,
  confidence,
  modelAttribution,
}: PersistSuggestionDecisionParams): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_id')
    .eq('id', user.id)
    .single()

  const { data: section } = await supabase
    .from('proposal_sections')
    .select('section_title')
    .eq('id', sectionId)
    .single()

  const actionType =
    decision === 'accepted' ? 'ai_suggestion_accepted' : 'ai_suggestion_rejected'

  await supabase.from('activity_feed').insert({
    action_type: actionType,
    entity_type: 'proposal_section',
    entity_id: sectionId,
    entity_name: section?.section_title ?? '',
    user_id: user.id,
    user_name: profile?.full_name ?? 'Unknown',
    company_id: profile?.company_id ?? null,
    opportunity_id: opportunityId,
    description: `${decision === 'accepted' ? 'Accepted' : 'Rejected'} AI suggestion (${confidence} confidence)`,
    metadata: JSON.parse(JSON.stringify({
      suggestion_id: suggestionId,
      decision,
      content_preview: content.slice(0, 200),
      confidence,
      model_attribution: modelAttribution,
    })),
  })

  await supabase.from('audit_logs').insert({
    action: actionType,
    table_name: 'proposal_sections',
    record_id: sectionId,
    user_id: user.id,
    new_values: JSON.parse(JSON.stringify({
      suggestion_id: suggestionId,
      decision,
      confidence,
      model_attribution: modelAttribution,
      content_preview: content.slice(0, 200),
    })),
  })

  return { success: true }
}
