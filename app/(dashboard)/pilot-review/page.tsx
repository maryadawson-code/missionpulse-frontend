// filepath: app/(dashboard)/pilot-review/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateEngagementScore } from '@/lib/billing/engagement'
import Link from 'next/link'

export default async function PilotReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) redirect('/dashboard')

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, pilot_end_date, pilot_amount_cents, plan_id')
    .eq('company_id', profile.company_id)
    .single()

  if (!sub || !['pilot', 'pilot_expired'].includes(sub.status ?? '')) {
    redirect('/dashboard')
  }

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name, annual_price')
    .eq('id', sub.plan_id)
    .single()

  const engagement = await calculateEngagementScore(profile.company_id)

  const endDate = sub.pilot_end_date ? new Date(sub.pilot_end_date) : null
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))
    : 0
  const isExpired = sub.status === 'pilot_expired'
  const creditAmount = sub.pilot_amount_cents ?? 0
  const annualPrice = plan?.annual_price ?? 0
  const amountDue = Math.max(0, annualPrice - creditAmount)
  const timeSaved = engagement.breakdown.ai_queries * 2 + engagement.breakdown.proposals_created * 4

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          {isExpired ? 'Your Pilot Has Ended' : 'Your Pilot ROI Report'}
        </h1>
        <p className="text-gray-400 mt-2">
          {isExpired
            ? 'Your data is preserved for 30 days. Convert now to keep full access.'
            : `${daysRemaining} days remaining \u2014 here\u2019s what you\u2019ve accomplished.`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'AI Queries Run', value: engagement.breakdown.ai_queries },
          { label: 'Proposals Created', value: engagement.breakdown.proposals_created },
          { label: 'Compliance Items', value: engagement.breakdown.compliance_matrices },
          { label: 'Est. Hours Saved', value: `~${timeSaved}hr` },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#00E5FA]">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Time Comparison */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-white">Pilot vs. Manual Process</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Compliance matrix (manual)</span>
            <span className="text-red-400">~4 hours each</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Compliance matrix (MissionPulse)</span>
            <span className="text-green-400">~15 minutes</span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
            <span className="text-gray-300">Est. time saved this pilot</span>
            <span className="text-[#00E5FA]">~{timeSaved} hours</span>
          </div>
        </div>
      </div>

      {/* Conversion CTA */}
      <div className="bg-gradient-to-r from-[#00E5FA]/10 to-transparent border border-[#00E5FA]/30 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">
          Convert to Annual \u2014 {plan?.name ?? 'Your Plan'}
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Annual plan price</span>
            <span>{fmt(annualPrice)}</span>
          </div>
          <div className="flex justify-between text-green-400">
            <span>Pilot credit applied</span>
            <span>&minus; {fmt(creditAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-2">
            <span>Due today</span>
            <span>{fmt(amountDue)}</span>
          </div>
        </div>
        <Link
          href="/api/billing/checkout?interval=annual"
          className="block w-full text-center px-6 py-3 bg-[#00E5FA] text-[#00050F] font-bold rounded-lg hover:bg-[#00E5FA]/90 transition-colors"
        >
          Convert Now \u2014 {fmt(amountDue)} Due Today
        </Link>
        <p className="text-xs text-gray-500 text-center">
          Pilot credit automatically applied at checkout.
        </p>
      </div>

      {/* Data preservation note for expired */}
      {isExpired && (
        <div className="border border-gray-700 rounded-xl p-5 text-center space-y-2">
          <div className="text-gray-300 font-medium">Your data is safe</div>
          <p className="text-gray-400 text-sm">
            All proposals, compliance matrices, and team data preserved for 30 days.
            Convert to restore full access immediately.
          </p>
        </div>
      )}
    </div>
  )
}
