/**
 * Onboarding auto-completion hooks — fire-and-forget.
 * Called from action handlers after successful operations.
 * Never throws — failures are silently ignored so parent actions aren't affected.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { completeOnboardingStep } from './onboarding'

/**
 * Resolve the current user's company_id and complete an onboarding step.
 * Safe to call from any server action — non-blocking, never throws.
 */
export async function tryCompleteOnboardingStep(
  stepId: string
): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return

    await completeOnboardingStep(profile.company_id, stepId)
  } catch {
    // Silent — onboarding tracking must never break core actions
  }
}
