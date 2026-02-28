'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitFeatureSuggestion(
  title: string,
  description: string,
  category: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('feature_suggestions').insert({
    title,
    description,
    category,
    submitted_by: user.id,
    status: 'submitted',
    votes: 1,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function voteForSuggestion(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('feature_votes')
    .select('id')
    .eq('suggestion_id', suggestionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVote) {
    return { success: false, error: 'Already voted' }
  }

  // Insert vote
  const { error: voteError } = await supabase
    .from('feature_votes')
    .insert({ suggestion_id: suggestionId, user_id: user.id })

  if (voteError) return { success: false, error: voteError.message }

  // Atomic increment via database RPC
  await supabase.rpc('increment_votes', { suggestion_id: suggestionId })

  return { success: true }
}
