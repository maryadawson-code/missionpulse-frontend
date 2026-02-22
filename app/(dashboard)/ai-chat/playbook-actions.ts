'use server'

import { createClient } from '@/lib/supabase/server'

export interface PlaybookResult {
  id: string
  title: string
  category: string | null
  content: string
  score: number
}

export async function searchPlaybook(
  query: string
): Promise<{ success: boolean; results?: PlaybookResult[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!query.trim()) return { success: true, results: [] }

  const searchTerms = query.trim().toLowerCase()

  // Search playbook entries by keyword matching (schema: assistant_response, not content)
  const { data, error } = await supabase
    .from('playbook_entries')
    .select('id, title, category, assistant_response')
    .or(`title.ilike.%${searchTerms}%,assistant_response.ilike.%${searchTerms}%,category.ilike.%${searchTerms}%`)
    .limit(10)

  if (error) return { success: false, error: error.message }

  // Score results by relevance (title match > response match)
  const results: PlaybookResult[] = (data ?? []).map((entry) => {
    let score = 0
    const titleLower = (entry.title ?? '').toLowerCase()
    const responseLower = (entry.assistant_response ?? '').toLowerCase()
    if (titleLower.includes(searchTerms)) score += 0.8
    if (responseLower.includes(searchTerms)) score += 0.5
    // Boost for exact title match
    if (titleLower === searchTerms) score = 1.0
    return {
      id: entry.id,
      title: entry.title ?? 'Untitled',
      category: entry.category,
      content: entry.assistant_response ?? '',
      score: Math.min(score, 1.0),
    }
  })

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return { success: true, results }
}
