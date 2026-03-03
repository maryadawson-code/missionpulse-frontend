/**
 * Onboarding Progress — Persist wizard state in profiles.preferences JSONB.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

// ─── Types ──────────────────────────────────────────────────

export interface OnboardingProgress {
  currentStep: number
  skippedSteps: number[]
  completedSteps: number[]
  onboardingComplete: boolean
}

// ─── Queries ────────────────────────────────────────────────

export async function getOnboardingProgress(
  userId: string
): Promise<OnboardingProgress> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.preferences as Record<string, unknown>) ?? {}

  return {
    currentStep: typeof prefs.onboarding_step === 'number' ? prefs.onboarding_step : 1,
    skippedSteps: Array.isArray(prefs.onboarding_skipped) ? (prefs.onboarding_skipped as number[]) : [],
    completedSteps: Array.isArray(prefs.onboarding_completed) ? (prefs.onboarding_completed as number[]) : [],
    onboardingComplete: prefs.onboarding_complete === true,
  }
}

export async function saveOnboardingProgress(
  userId: string,
  step: number,
  skipped?: boolean
): Promise<void> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
  const existingSkipped = Array.isArray(prefs.onboarding_skipped)
    ? (prefs.onboarding_skipped as number[])
    : []
  const existingCompleted = Array.isArray(prefs.onboarding_completed)
    ? (prefs.onboarding_completed as number[])
    : []

  const updatedPrefs: Record<string, unknown> = {
    ...prefs,
    onboarding_step: step,
  }

  if (skipped && !existingSkipped.includes(step)) {
    updatedPrefs.onboarding_skipped = [...existingSkipped, step]
  } else if (!skipped && !existingCompleted.includes(step)) {
    updatedPrefs.onboarding_completed = [...existingCompleted, step]
  }

  await supabase
    .from('profiles')
    .update({ preferences: updatedPrefs as Json })
    .eq('id', userId)
}

export async function completeOnboarding(userId: string): Promise<void> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.preferences as Record<string, unknown>) ?? {}

  await supabase
    .from('profiles')
    .update({
      preferences: {
        ...prefs,
        onboarding_complete: true,
        onboarding_step: 5,
      } as Json,
    })
    .eq('id', userId)
}
