'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Embedding utilities for pgvector semantic search.
 * Uses text-based ILIKE search as a production fallback.
 * When AskSage embedding endpoint is configured, this will
 * upgrade to pgvector cosine similarity search.
 */

/**
 * Search playbook entries using text search (ILIKE across title, response, category).
 * Returns matching entry IDs for downstream consumption.
 */
export async function searchPlaybookEntries(
  query: string,
  options?: { limit?: number; category?: string }
): Promise<string[]> {
  if (!query.trim()) return []

  const supabase = await createClient()
  const limit = options?.limit ?? 10

  let qb = supabase
    .from('playbook_entries')
    .select('id')
    .or(`title.ilike.%${query}%,assistant_response.ilike.%${query}%,category.ilike.%${query}%`)
    .order('effectiveness_score', { ascending: false })
    .limit(limit)

  if (options?.category) {
    qb = qb.eq('category', options.category)
  }

  const { data, error } = await qb

  if (error || !data) return []
  return data.map((row) => row.id)
}
