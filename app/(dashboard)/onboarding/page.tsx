import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/lib/onboarding/progress'
import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard'

export const metadata: Metadata = {
  title: 'Welcome to MissionPulse — Get Started',
}

const RBAC_ROLES = [
  'executive',
  'operations',
  'capture_manager',
  'proposal_manager',
  'volume_lead',
  'pricing_manager',
  'contracts',
  'hr_staffing',
  'author',
  'partner',
  'subcontractor',
  'consultant',
]

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, preferences')
    .eq('id', user.id)
    .single()

  // Check if already complete
  const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
  if (prefs.onboarding_complete === true) redirect('/dashboard')

  const companyId = profile?.company_id
  if (!companyId) redirect('/dashboard')

  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  // Get current progress
  const progress = await getOnboardingProgress(user.id)

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          Welcome to MissionPulse
        </h1>
        <p className="mt-2 text-gray-400">
          Complete these steps to get the most out of your experience.
          You can skip any step and come back later.
        </p>
      </div>

      <OnboardingWizard
        userId={user.id}
        companyId={companyId}
        companyName={company?.name ?? ''}
        initialStep={progress.currentStep}
        roles={RBAC_ROLES}
      />
    </div>
  )
}
