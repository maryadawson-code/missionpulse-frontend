'use server'

import { createClient } from '@/lib/supabase/server'

interface SubmitAIFeedbackParams {
  messageId: string
  sessionId: string
  rating: 'positive' | 'negative' | null
  agentType: string
  model?: string
  confidence?: string
  comment?: string
}

/**
 * Submit thumbs up/down feedback on an AI chat message.
 * Writes to chat_messages.metadata (inline), activity_feed (user-visible),
 * and audit_logs (immutable compliance — NIST AU-9).
 * Fire-and-forget — callers should not await this.
 */
export async function submitAIFeedback({
  messageId,
  sessionId,
  rating,
  agentType,
  model,
  confidence,
  comment,
}: SubmitAIFeedbackParams): Promise<{ success: boolean; error?: string }> {
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

  // Read existing metadata so we merge, not overwrite
  const { data: existing } = await supabase
    .from('chat_messages')
    .select('metadata')
    .eq('id', messageId)
    .single()

  const existingMetadata =
    existing?.metadata && typeof existing.metadata === 'object'
      ? (existing.metadata as Record<string, unknown>)
      : {}

  // Merge feedback fields into metadata
  const updatedMetadata = {
    ...existingMetadata,
    feedback_rating: rating,
    feedback_by: user.id,
    feedback_at: new Date().toISOString(),
    ...(comment ? { feedback_comment: comment } : {}),
  }

  await supabase
    .from('chat_messages')
    .update({ metadata: updatedMetadata })
    .eq('id', messageId)

  // Only write to activity_feed and audit_logs when setting a rating (not clearing)
  if (rating) {
    const actionType =
      rating === 'positive' ? 'ai_feedback_positive' : 'ai_feedback_negative'

    await supabase.from('activity_feed').insert({
      action_type: actionType,
      entity_type: 'chat_message',
      entity_id: messageId,
      entity_name: `AI Chat (${agentType})`,
      user_id: user.id,
      user_name: profile?.full_name ?? 'Unknown',
      company_id: profile?.company_id ?? null,
      description: `${rating === 'positive' ? 'Positive' : 'Negative'} feedback on ${agentType} agent response`,
      metadata: JSON.parse(
        JSON.stringify({
          session_id: sessionId,
          agent_type: agentType,
          model: model ?? null,
          confidence: confidence ?? null,
          comment: comment ?? null,
        })
      ),
    })

    await supabase.from('audit_logs').insert({
      action: actionType,
      table_name: 'chat_messages',
      record_id: messageId,
      user_id: user.id,
      new_values: JSON.parse(
        JSON.stringify({
          rating,
          agent_type: agentType,
          model: model ?? null,
          confidence: confidence ?? null,
          session_id: sessionId,
          comment: comment ?? null,
        })
      ),
    })
  }

  return { success: true }
}
