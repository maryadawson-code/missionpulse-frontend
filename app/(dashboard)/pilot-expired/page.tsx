import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateEngagementScore } from '@/lib/billing/engagement'
import Link from 'next/link'

export default async function PilotExpiredPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) redirect('/dashboard')

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, pilot_start_date, pilot_end_date, pilot_amount_cents, plan_id')
    .eq('company_id', profile.company_id)
    .single()

  if (!sub || sub.status !== 'pilot_expired') {
    redirect('/dashboard')
  }

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name, annual_price')
    .eq('id', sub.plan_id)
    .single()

  const engagement = await calculateEngagementScore(profile.company_id)
  const creditAmount = (sub.pilot_amount_cents as number) ?? 0
  const annualPrice = plan?.annual_price ?? 0

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    })

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg w-full space-y-6 text-center">
        <div className="text-5xl">&#x23F0;</div>
        <h1 className="text-3xl font-bold text-white">
          Your MissionPulse Pilot Has Ended
        </h1>
        <p className="text-gray-400">
          Your data is preserved for 30 days. Upgrade now to keep full access to your
          proposals, compliance matrices, and AI tools.
        </p>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xl font-bold text-[#00E5FA]">{engagement.breakdown.proposals_created}</div>
            <div className="text-xs text-gray-400 mt-1">Proposals</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xl font-bold text-[#00E5FA]">{engagement.breakdown.ai_queries}</div>
            <div className="text-xs text-gray-400 mt-1">AI Queries</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xl font-bold text-[#00E5FA]">{engagement.breakdown.compliance_matrices}</div>
            <div className="text-xs text-gray-400 mt-1">Compliance Items</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#00E5FA]/10 to-transparent border border-[#00E5FA]/30 rounded-xl p-5 space-y-3">
          <div className="text-sm text-gray-300">
            Your pilot credit of <span className="text-[#00E5FA] font-semibold">{fmt(creditAmount)}</span> applies
            toward {plan?.name ?? 'your plan'} at {fmt(annualPrice)}/year
          </div>
          <Link
            href="/pilot-review"
            className="block w-full text-center px-6 py-3 bg-[#00E5FA] text-[#00050F] font-bold rounded-lg hover:bg-[#00E5FA]/90 transition-colors"
          >
            Upgrade to Keep Access
          </Link>
        </div>

        <p className="text-xs text-gray-500">
          After 30 days, your data will be permanently deleted per our data retention policy.
        </p>
      </div>
    </div>
  )
}
