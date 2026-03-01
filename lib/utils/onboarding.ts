'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Check if user has completed onboarding.
 */
export async function isOnboardingComplete(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return true // Don't show tour to unauthenticated

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  const prefs = profile?.preferences as Record<string, unknown> | null
  return prefs?.onboarding_complete === true
}

/**
 * Mark onboarding as complete.
 */
export async function completeOnboarding() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  const existingPrefs =
    (profile?.preferences as Record<string, unknown> | null) ?? {}

  const { error } = await supabase
    .from('profiles')
    .update({
      preferences: { ...existingPrefs, onboarding_complete: true },
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reset onboarding (for testing).
 */
export async function resetOnboarding() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  const existingPrefs =
    (profile?.preferences as Record<string, unknown> | null) ?? {}

  const { error } = await supabase
    .from('profiles')
    .update({
      preferences: { ...existingPrefs, onboarding_complete: false },
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
