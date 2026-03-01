// filepath: app/(dashboard)/strategy/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { requireMFA } from '@/lib/rbac/server'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusBadge(status: string | null): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'pending':
    case 'draft':
      return 'bg-amber-500/20 text-amber-300'
    case 'rejected':
      return 'bg-red-500/20 text-red-300'
    default:
      return 'bg-gray-500/20 text-muted-foreground'
  }
}

function priorityBadge(priority: number | null): string {
  const p = priority ?? 3
  if (p <= 1) return 'text-red-400'
  if (p <= 2) return 'text-amber-400'
  return 'text-muted-foreground'
}

export default async function StrategyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'strategy', 'shouldRender')) {
    return null
  }

  // CUI module — enforce MFA (AAL2) per NIST AC-3 / CMMC
  await requireMFA()

  // Fetch win themes
  const { data: themes, error: themesError } = await supabase
    .from('win_themes')
    .select('id, theme_text, theme_type, priority, status, evaluation_factor, ghost_competitor, ghost_statement, created_at')
    .order('priority', { ascending: true })
    .limit(50)

  // Fetch discriminators
  const { data: discriminators, error: discError } = await supabase
    .from('discriminators')
    .select('id, discriminator_text, discriminator_type, status, vs_competitor, quantified_value, evidence_source, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const themeList = themes ?? []
  const discList = discriminators ?? []

  // Build Section M evaluation criteria alignment
  const evalFactors = new Map<string, { themes: string[]; count: number }>()
  for (const theme of themeList) {
    const factor = theme.evaluation_factor
    if (!factor) continue
    const existing = evalFactors.get(factor) ?? { themes: [], count: 0 }
    existing.themes.push(theme.theme_text)
    existing.count++
    evalFactors.set(factor, existing)
  }
  const evalCriteria = Array.from(evalFactors.entries())
    .map(([factor, data]) => ({ factor, ...data }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Strategy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define win themes, competitive positioning, and capture strategies for upcoming pursuits.
        </p>
      </div>

      {(themesError || discError) && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load strategy data: {themesError?.message ?? discError?.message}
        </div>
      )}

      {/* Win Themes */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Win Themes</h2>
          <p className="text-xs text-muted-foreground mt-1">Core messaging themes that differentiate your solution</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eval Factor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ghost</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {themeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No win themes defined yet. Themes will appear here as capture strategy develops.
                  </td>
                </tr>
              ) : (
                themeList.map((theme) => (
                  <tr key={theme.id} className="transition-colors hover:bg-muted/30">
                    <td className={`whitespace-nowrap px-4 py-3 text-sm font-mono font-bold ${priorityBadge(theme.priority)}`}>
                      #{theme.priority ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                      {theme.theme_text}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {(theme.theme_type ?? 'general').replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {theme.evaluation_factor ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(theme.status)}`}>
                        {(theme.status ?? 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate" title={theme.ghost_statement ?? ''}>
                      {theme.ghost_competitor ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(theme.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discriminators */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Discriminators</h2>
          <p className="text-xs text-muted-foreground mt-1">Unique strengths that set you apart from competitors</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discriminator</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">vs. Competitor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantified Value</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {discList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No discriminators defined yet. Add competitive differentiators to strengthen win strategy.
                  </td>
                </tr>
              ) : (
                discList.map((disc) => (
                  <tr key={disc.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                      {disc.discriminator_text}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {(disc.discriminator_type ?? 'general').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(disc.status)}`}>
                        {(disc.status ?? 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {disc.vs_competitor ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {disc.quantified_value ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate" title={disc.evidence_source ?? ''}>
                      {disc.evidence_source ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section M Evaluation Criteria */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Section M — Evaluation Criteria Alignment</h2>
          <p className="text-xs text-muted-foreground mt-1">
            How win themes map to RFP evaluation factors
          </p>
        </div>
        {evalCriteria.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No evaluation factors assigned to win themes yet. Add evaluation factors to your win themes to see alignment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evaluation Factor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    Aligned Themes
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Coverage
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Theme Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {evalCriteria.map((ec) => (
                  <tr key={ec.factor} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-primary">
                      {ec.factor}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {ec.count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              ec.count >= 3
                                ? 'bg-emerald-400'
                                : ec.count >= 2
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(ec.count * 33, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {ec.count >= 3 ? 'Strong' : ec.count >= 2 ? 'Moderate' : 'Weak'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={ec.themes.join('; ')}>
                      {ec.themes.slice(0, 2).join('; ')}
                      {ec.themes.length > 2 && ` +${ec.themes.length - 2} more`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {themeList.length} win theme{themeList.length !== 1 ? 's' : ''}, {discList.length} discriminator{discList.length !== 1 ? 's' : ''}, and {evalCriteria.length} evaluation factor{evalCriteria.length !== 1 ? 's' : ''}.
      </p>
    </div>
  )
}
