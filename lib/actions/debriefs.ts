'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

interface CreateDebriefInput {
  opportunity_id: string
  opportunity_name: string
  debrief_type: string
  debrief_date: string
  outcome: string
  contract_value: number | null
  notes: string
  strengths: string[]
  weaknesses: string[]
  lessons_learned: string[]
}

export async function createDebrief(
  input: CreateDebriefInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('debriefs').insert({
    opportunity_id: input.opportunity_id || null,
    opportunity_name: input.opportunity_name,
    debrief_type: input.debrief_type,
    debrief_date: input.debrief_date,
    outcome: input.outcome,
    contract_value: input.contract_value,
    notes: input.notes,
    strengths: input.strengths as unknown as Json,
    weaknesses: input.weaknesses as unknown as Json,
    lessons_learned: input.lessons_learned as unknown as Json,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
