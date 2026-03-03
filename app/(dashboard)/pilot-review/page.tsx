// filepath: app/(dashboard)/pilot-review/page.tsx

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { generateROIReport } from '@/lib/billing/pilot-conversion'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pilot ROI Review — MissionPulse',
}

function StatCard({
  label,
  value,
  comparison,
}: {
  label: string
  value: string
  comparison?: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {comparison && (
        <p className="mt-1 text-xs text-gray-400">{comparison}</p>
      )}
    </div>
  )
}

export default async function PilotReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  const companyId = profile?.company_id
  if (!companyId) redirect('/dashboard')

  const report = await generateROIReport(companyId)

  // Get pilot credit for display
  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('pilot_amount_cents, status')
    .eq('company_id', companyId)
    .single()

  const creditDollars = ((sub?.pilot_amount_cents as number) ?? 0) / 100
  const isPilotOrExpired = ['pilot', 'expired'].includes(
    (sub?.status as string) ?? ''
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Your Pilot ROI Report
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Here&apos;s what you accomplished during your {report.daysActive}-day
          pilot.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Proposals Drafted"
          value={report.proposalsDrafted.toString()}
          comparison={`vs ~${report.estimatedManualHours}hr manual effort`}
        />
        <StatCard
          label="AI Queries"
          value={report.aiQueriesCount.toLocaleString()}
          comparison={`~${report.timeSavedHours}hr saved`}
        />
        <StatCard
          label="Compliance Items"
          value={report.complianceItemsTracked.toString()}
          comparison="SHALL/MUST requirements tracked"
        />
        <StatCard
          label="Documents Generated"
          value={report.documentsGenerated.toString()}
          comparison="Proposals, volumes, and exports"
        />
      </div>

      {/* Side-by-side Comparison */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Your Pilot vs. Without MissionPulse
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-[#00E5FA]/20 bg-[#00E5FA]/5 p-5">
            <h3 className="text-sm font-semibold text-[#00E5FA] mb-3">
              With MissionPulse
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <span>Time on proposals</span>
                <span className="font-medium text-white">
                  ~{Math.round(report.timeSavedHours * 0.6)}hr
                </span>
              </li>
              <li className="flex justify-between">
                <span>Compliance coverage</span>
                <span className="font-medium text-[#00E5FA]">100%</span>
              </li>
              <li className="flex justify-between">
                <span>AI-assisted sections</span>
                <span className="font-medium text-white">
                  {report.aiQueriesCount}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Team members active</span>
                <span className="font-medium text-white">
                  {report.teamMembersActive}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Without MissionPulse
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex justify-between">
                <span>Time on proposals</span>
                <span className="font-medium text-gray-300">
                  ~{report.estimatedManualHours}hr (industry avg)
                </span>
              </li>
              <li className="flex justify-between">
                <span>Compliance coverage</span>
                <span className="font-medium text-gray-300">~85%</span>
              </li>
              <li className="flex justify-between">
                <span>AI-assisted sections</span>
                <span className="font-medium text-gray-300">0</span>
              </li>
              <li className="flex justify-between">
                <span>Manual coordination</span>
                <span className="font-medium text-gray-300">
                  Email + spreadsheets
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Engagement Score */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Engagement Score
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1E293B"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={
                  report.engagementScore > 70
                    ? '#10B981'
                    : report.engagementScore > 40
                      ? '#F59E0B'
                      : '#EF4444'
                }
                strokeWidth="3"
                strokeDasharray={`${report.engagementScore}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {report.engagementScore}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-300">
              {report.engagementScore > 70
                ? 'Excellent engagement — you\'re getting strong value from MissionPulse.'
                : report.engagementScore > 40
                  ? 'Good start — there\'s more to explore.'
                  : 'Getting started — try more features to maximize ROI.'}
            </p>
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          AI Token Usage
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-[#00E5FA]"
              style={{
                width: `${
                  report.tokensAllocated > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (report.tokensConsumed / report.tokensAllocated) * 100
                        )
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {(report.tokensConsumed / 1000).toFixed(0)}K /{' '}
            {(report.tokensAllocated / 1000).toFixed(0)}K tokens
          </span>
        </div>
      </div>

      {/* CTA */}
      {isPilotOrExpired && (
        <div className="rounded-xl border border-[#00E5FA]/20 bg-gradient-to-r from-[#0F172A] to-[#00050F] p-6 text-center">
          <h2 className="text-xl font-bold text-white">Ready to continue?</h2>
          {creditDollars > 0 && (
            <p className="mt-1 text-sm text-gray-400">
              Your ${creditDollars.toFixed(0)} pilot payment will be credited
              toward your annual subscription.
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-6 py-2.5 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
            >
              Upgrade Now
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
