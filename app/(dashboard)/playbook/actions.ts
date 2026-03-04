'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  success: boolean
  error?: string
}

export async function createPlaybookEntry(data: {
  title: string
  category: string
  content: string
  keywords: string[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const entryId = crypto.randomUUID()
  const { error } = await supabase.from('playbook_entries').insert({
    id: entryId,
    title: data.title,
    category: data.category,
    user_prompt: data.content,
    assistant_response: '',
    keywords: data.keywords,
    quality_rating: 'good',
    effectiveness_score: 3,
    use_count: 0,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'create_playbook_entry',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'playbook_entry', entity_id: entryId, title: data.title, category: data.category },
  })

  revalidatePath('/playbook')
  return { success: true }
}

export async function updatePlaybookRating(
  entryId: string,
  rating: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const qualityMap: Record<number, string> = {
    1: 'poor',
    2: 'fair',
    3: 'good',
    4: 'very_good',
    5: 'excellent',
  }

  const { error } = await supabase
    .from('playbook_entries')
    .update({
      effectiveness_score: rating,
      quality_rating: qualityMap[rating] ?? 'good',
    })
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'update_playbook_rating',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'playbook_entry', entity_id: entryId, rating },
  })

  revalidatePath('/playbook')
  return { success: true }
}

export async function incrementUsage(entryId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // NOTE: Read-then-write is not atomic. Create an `increment_use_count` RPC
  // in Supabase for production-grade atomicity (similar to increment_votes).
  const { data: entry } = await supabase
    .from('playbook_entries')
    .select('use_count')
    .eq('id', entryId)
    .single()

  const { error } = await supabase
    .from('playbook_entries')
    .update({ use_count: (entry?.use_count ?? 0) + 1 })
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }

  // Track usage
  await supabase.from('playbook_usage').insert({
    entry_id: entryId,
    user_id: user.id,
  })

  return { success: true }
}

export async function deletePlaybookEntry(
  entryId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('playbook_entries')
    .delete()
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'delete_playbook_entry',
    user_name: user.email ?? 'Unknown',
    details: { entity_type: 'playbook_entry', entity_id: entryId },
  })

  revalidatePath('/playbook')
  return { success: true }
}
