// filepath: app/(dashboard)/blackhat/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'

function threatColor(level: string | null): string {
  switch (level) {
    case 'high':
    case 'critical':
      return 'bg-red-500/20 text-red-300'
    case 'medium':
      return 'bg-amber-500/20 text-amber-300'
    case 'low':
      return 'bg-emerald-500/20 text-emerald-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function BlackhatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'blackhat', 'shouldRender')) {
    redirect('/dashboard')
  }

  const { data: competitors, error } = await supabase
    .from('competitors')
    .select('id, name, threat_level, pwin_estimate, incumbent, strengths, weaknesses, likely_strategy, counter_strategy, ghost_themes, updated_at')
    .order('threat_level', { ascending: true })
    .limit(50)

  const items = competitors ?? []

  return (
    <div className="space-y-6">
      <CUIBanner marking="OPSEC" />
      <div>
        <h1 className="text-2xl font-bold text-white">Black Hat Review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conduct competitive analysis and black hat reviews to anticipate competitor strategies.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load competitors: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Competitor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Threat</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">pWin Est.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Incumbent</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Strengths</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Weaknesses</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Likely Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No competitor intel recorded yet. Add competitors to begin black hat analysis.
                  </td>
                </tr>
              ) : (
                items.map((comp) => (
                  <tr key={comp.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">
                      {comp.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${threatColor(comp.threat_level)}`}>
                        {(comp.threat_level ?? 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-300">
                      {comp.pwin_estimate != null ? `${comp.pwin_estimate}%` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {comp.incumbent ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px]">
                      {comp.strengths?.length ? comp.strengths.slice(0, 3).join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px]">
                      {comp.weaknesses?.length ? comp.weaknesses.slice(0, 3).join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate" title={comp.likely_strategy ?? ''}>
                      {comp.likely_strategy ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {items.length} competitor{items.length !== 1 ? 's' : ''}. Black hat data is classified CUI//OPSEC.
      </p>
    </div>
  )
}
