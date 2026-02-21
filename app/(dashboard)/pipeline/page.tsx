// filepath: app/(dashboard)/pipeline/page.tsx

import { createClient } from '@/lib/supabase/server'
import { getRolePermissions } from '@/lib/rbac/config'
import {
  formatCurrency,
  formatPwin,
  formatDate,
  pwinColor,
  phaseColor,
  statusColor,
} from '@/lib/utils/formatters'
import type { Opportunity } from '@/lib/types'
import Link from 'next/link'


export default async function PipelinePage() {
  const supabase = await createClient()

  // ─── Auth + Role ────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canEdit = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const perms = getRolePermissions(profile?.role ?? 'partner')
    canEdit = perms.pipeline?.canEdit === true
  }

  // ─── Fetch Opportunities ────────────────────────────────────
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, title, agency, ceiling, pwin, phase, status, due_date, submission_date, set_aside, owner_id, priority, contract_vehicle, naics_code')
    .order('updated_at', { ascending: false })

  const opps: Opportunity[] = (opportunities ?? []) as Opportunity[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            {opps.length} opportunit{opps.length === 1 ? 'y' : 'ies'} in pipeline
          </p>
        </div>
        {canEdit && (
          <Link
            href="/dashboard/pipeline/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Opportunity
          </Link>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load pipeline: {error.message}
        </div>
      )}

      {/* Empty State */}
      {!error && opps.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 py-16">
          <svg
            className="h-12 w-12 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-400">No opportunities yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Create your first opportunity to start building your pipeline.
          </p>
          {canEdit && (
            <Link
              href="/dashboard/pipeline/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
            >
              New Opportunity
            </Link>
          )}
        </div>
      )}

      {/* Pipeline Table */}
      {opps.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Opportunity
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Agency
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ceiling
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Win Prob
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Phase
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Set-Aside
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {opps.map((opp) => (
                  <tr
                    key={opp.id}
                    className="transition-colors hover:bg-gray-800/30"
                  >
                    {/* Title — links to War Room */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/pipeline/${opp.id}`}
                        className="font-medium text-gray-200 transition-colors hover:text-[#00E5FA]"
                      >
                        {opp.title}
                      </Link>
                      {opp.naics_code && (
                        <p className="mt-0.5 text-xs text-gray-500">NAICS: {opp.naics_code}</p>
                      )}
                    </td>

                    {/* Agency */}
                    <td className="px-4 py-3 text-gray-400">
                      {opp.agency ?? '—'}
                    </td>

                    {/* Ceiling */}
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {formatCurrency(opp.ceiling)}
                    </td>

                    {/* pWin */}
                    <td className={`px-4 py-3 text-center font-semibold ${pwinColor(opp.pwin)}`}>
                      {formatPwin(opp.pwin)}
                    </td>

                    {/* Phase */}
                    <td className="px-4 py-3">
                      {opp.phase ? (
                        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${phaseColor(opp.phase)}`}>
                          {opp.phase}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {opp.status ? (
                        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusColor(opp.status)}`}>
                          {opp.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(opp.due_date ?? opp.submission_date)}
                    </td>

                    {/* Set-Aside */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {opp.set_aside ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
