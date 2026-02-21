/**
 * AI Usage Logger — tracks all AI requests to token_usage table.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { TokenUsageEntry } from './types'

type Json = Database['public']['Tables']['token_usage']['Row']['metadata']

export async function logTokenUsage(
  entry: TokenUsageEntry
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('token_usage').insert({
      agent_id: entry.agent_id,
      input_tokens: entry.input_tokens,
      output_tokens: entry.output_tokens,
      estimated_cost_usd: entry.estimated_cost_usd,
      user_id: entry.user_id,
      opportunity_id: entry.opportunity_id ?? null,
      metadata: (entry.metadata ?? null) as unknown as Json,
    })
  } catch (err) {
    // Non-blocking: log failure but don't break the AI operation
    console.error('[ai-logger] Failed to log token usage:', err)
  }
}
