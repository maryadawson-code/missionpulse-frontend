// filepath: app/(dashboard)/onboarding/page.tsx

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/lib/billing/onboarding'
import { PilotChecklist } from '@/components/features/onboarding/PilotChecklist'

export const metadata: Metadata = {
  title: 'Welcome to MissionPulse — Get Started',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id
  if (!companyId) redirect('/dashboard')

  // If onboarding already complete, go to dashboard
  const progress = await getOnboardingProgress(companyId)
  if (progress.allComplete) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          Welcome to MissionPulse
        </h1>
        <p className="mt-2 text-gray-400">
          Complete these steps to get the most out of your 30-day pilot.
          You can skip any step and come back later.
        </p>
      </div>

      <PilotChecklist companyId={companyId} />

      <div className="text-center">
        <a
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now — go to Dashboard
        </a>
      </div>
    </div>
  )
}
