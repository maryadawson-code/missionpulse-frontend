// filepath: app/(dashboard)/compliance/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'compliant':
    case 'met':
    case 'complete':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'in_progress':
    case 'partial':
      return 'bg-amber-500/20 text-amber-300'
    case 'non_compliant':
    case 'not_met':
    case 'overdue':
      return 'bg-red-500/20 text-red-300'
    case 'not_applicable':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'compliance', 'shouldRender')) {
    redirect('/')
  }

  const { data: items, error } = await supabase
    .from('compliance_items')
    .select('id, requirement, section, source, status, due_date, proposal_section, response, updated_at')
    .order('due_date', { ascending: true })
    .limit(100)

  const compItems = items ?? []
  const compliantCount = compItems.filter((i) => i.status === 'compliant' || i.status === 'met' || i.status === 'complete').length
  const overallScore = compItems.length > 0 ? Math.round((compliantCount / compItems.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track CMMC, NIST 800-171, and DFARS compliance posture across your organization.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Requirements</p>
          <p className="mt-2 text-2xl font-bold text-white">{compItems.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Compliant</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{compliantCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Compliance Score</p>
          <p className="mt-2 text-2xl font-bold text-[#00E5FA]">{overallScore}%</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load compliance data: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Requirement</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Section</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Source</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Proposal Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {compItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No compliance items tracked yet. Requirements will appear as they are mapped from solicitations.
                  </td>
                </tr>
              ) : (
                compItems.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200 max-w-xs">
                      {item.requirement}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {item.section ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {item.source ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
                        {(item.status ?? 'pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(item.due_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {item.proposal_section ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {compItems.length} compliance requirement{compItems.length !== 1 ? 's' : ''}. Compliance tracking per NIST SP 800-171 / CMMC Level 2.
      </p>
    </div>
  )
}
