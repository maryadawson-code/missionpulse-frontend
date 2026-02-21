/**
 * Pilot Onboarding — 5-step checklist for pilot accounts.
 *
 * Steps:
 *   1. Create an opportunity
 *   2. Run an AI agent
 *   3. Invite a team member
 *   4. Generate a document
 *   5. Review compliance matrix
 *
 * Progress stored in company_subscriptions.metadata.onboarding_progress
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────

export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  href: string
}

export interface OnboardingProgress {
  steps: OnboardingStep[]
  completedCount: number
  totalSteps: number
  percentComplete: number
  allComplete: boolean
}

// ─── Step Definitions ───────────────────────────────────────

const STEP_DEFINITIONS: Array<{
  id: string
  title: string
  description: string
  href: string
}> = [
  {
    id: 'create_opportunity',
    title: 'Create an Opportunity',
    description: 'Add your first pursuit to the pipeline',
    href: '/pipeline/new',
  },
  {
    id: 'run_ai_agent',
    title: 'Run an AI Agent',
    description: 'Use capture analysis or AI chat on an opportunity',
    href: '/ai-chat',
  },
  {
    id: 'invite_team',
    title: 'Invite a Team Member',
    description: 'Add a colleague to collaborate on proposals',
    href: '/admin/users',
  },
  {
    id: 'generate_document',
    title: 'Generate a Document',
    description: 'Create a proposal section or export a binder',
    href: '/documents',
  },
  {
    id: 'review_compliance',
    title: 'Review Compliance Matrix',
    description: 'Check requirements against an RFP',
    href: '/pipeline',
  },
]

// ─── Progress Queries ───────────────────────────────────────

/**
 * Get the current onboarding progress for a company.
 */
export async function getOnboardingProgress(
  companyId: string
): Promise<OnboardingProgress> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('metadata')
    .eq('company_id', companyId)
    .single()

  const meta = (sub?.metadata as Record<string, unknown>) ?? {}
  const completed = (meta.onboarding_completed_steps as string[]) ?? []

  const steps: OnboardingStep[] = STEP_DEFINITIONS.map((def) => ({
    ...def,
    completed: completed.includes(def.id),
  }))

  const completedCount = steps.filter((s) => s.completed).length

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    percentComplete: Math.round((completedCount / steps.length) * 100),
    allComplete: completedCount === steps.length,
  }
}

/**
 * Mark an onboarding step as complete.
 */
export async function completeOnboardingStep(
  companyId: string,
  stepId: string
): Promise<{ success: boolean; allComplete: boolean }> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('metadata')
    .eq('company_id', companyId)
    .single()

  const meta = (sub?.metadata as Record<string, unknown>) ?? {}
  const completed = (meta.onboarding_completed_steps as string[]) ?? []

  if (completed.includes(stepId)) {
    const progress = await getOnboardingProgress(companyId)
    return { success: true, allComplete: progress.allComplete }
  }

  const updatedCompleted = [...completed, stepId]
  const allComplete = updatedCompleted.length === STEP_DEFINITIONS.length

  await supabase
    .from('company_subscriptions')
    .update({
      metadata: JSON.parse(
        JSON.stringify({
          ...meta,
          onboarding_completed_steps: updatedCompleted,
          onboarding_progress: Math.round(
            (updatedCompleted.length / STEP_DEFINITIONS.length) * 100
          ),
        })
      ),
    })
    .eq('company_id', companyId)

  return { success: true, allComplete }
}

/**
 * Check if a company is currently in a pilot with incomplete onboarding.
 */
export async function shouldShowOnboarding(
  companyId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, metadata')
    .eq('company_id', companyId)
    .single()

  if (!sub || sub.status !== 'pilot') return false

  const meta = (sub.metadata as Record<string, unknown>) ?? {}
  const completed = (meta.onboarding_completed_steps as string[]) ?? []

  return completed.length < STEP_DEFINITIONS.length
}
