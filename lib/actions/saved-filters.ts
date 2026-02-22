'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

export async function getSavedFilters(): Promise<{
  data: { id: string; name: string; filters: unknown; is_default: boolean | null }[]
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('saved_filters')
    .select('id, name, filters, is_default')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function createSavedFilter(
  name: string,
  filters: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_filters')
    .insert({ name, filters: filters as unknown as Json })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteSavedFilter(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_filters')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
