import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function impactStyle(impact: string | null): string {
  switch (impact?.toLowerCase()) {
    case 'critical':
    case 'very high':
      return 'bg-red-500/15 text-red-300'
    case 'high':
      return 'bg-orange-500/15 text-orange-300'
    case 'medium':
      return 'bg-amber-500/15 text-amber-300'
    case 'low':
      return 'bg-emerald-500/15 text-emerald-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'mitigated':
    case 'resolved':
    case 'closed':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'active':
    case 'open':
      return 'bg-red-500/15 text-red-300'
    case 'monitoring':
      return 'bg-amber-500/15 text-amber-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function RisksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!opp) notFound()

  // Fetch risks
  const { data: risks } = await supabase
    .from('risks')
    .select(
      'id, risk_title, description, category, probability, impact, risk_score, owner, status, due_date, created_at'
    )
    .eq('opportunity_id', id)
    .order('risk_score', { ascending: false })

  // Fetch mitigations for all risks
  const riskIds = (risks ?? []).map((r) => r.id)
  const mitigationsMap: Record<
    string,
    { id: string; action: string; assigned_to: string | null; status: string | null; due_date: string | null }[]
  > = {}

  if (riskIds.length > 0) {
    const { data: mitigations } = await supabase
      .from('risk_mitigations')
      .select('id, risk_id, action, assigned_to, status, due_date')
      .in('risk_id', riskIds)
      .order('created_at', { ascending: true })

    for (const m of mitigations ?? []) {
      if (!m.risk_id) continue
      if (!mitigationsMap[m.risk_id]) mitigationsMap[m.risk_id] = []
      mitigationsMap[m.risk_id].push(m)
    }
  }

  const riskItems = risks ?? []

  // Risk summary stats
  const activeRisks = riskItems.filter(
    (r) => r.status !== 'mitigated' && r.status !== 'closed' && r.status !== 'resolved'
  )
  const highRisks = riskItems.filter(
    (r) => (r.risk_score ?? 0) >= 15 || r.impact === 'critical' || r.impact === 'very high'
  )
  const avgScore =
    riskItems.length > 0
      ? Math.round(
          riskItems.reduce((sum, r) => sum + (r.risk_score ?? 0), 0) /
            riskItems.length
        )
      : 0

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Risk Register' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Risk Register</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and mitigate risks for {opp.title}.
        </p>
      </div>

      {/* Risk Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Risks</p>
          <p className="mt-1 text-lg font-bold text-white">
            {riskItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-lg font-bold text-red-400">
            {activeRisks.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">High/Critical</p>
          <p className="mt-1 text-lg font-bold text-amber-400">
            {highRisks.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Avg Score</p>
          <p className="mt-1 text-lg font-bold text-white">{avgScore}</p>
        </div>
      </div>

      {/* Risk List */}
      {riskItems.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No risks identified for this opportunity yet. Add risks to track
            threats and mitigation plans.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {riskItems.map((risk) => {
            const mitigations = mitigationsMap[risk.id] ?? []
            return (
              <div
                key={risk.id}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {risk.risk_title}
                      </h3>
                      {risk.impact && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${impactStyle(
                            risk.impact
                          )}`}
                        >
                          {risk.impact}
                        </span>
                      )}
                      {risk.status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(
                            risk.status
                          )}`}
                        >
                          {risk.status}
                        </span>
                      )}
                    </div>
                    {risk.description && (
                      <p className="mt-1 text-xs text-gray-400">
                        {risk.description}
                      </p>
                    )}
                  </div>
                  {risk.risk_score != null && (
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        risk.risk_score >= 15
                          ? 'bg-red-500/15 text-red-300'
                          : risk.risk_score >= 8
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {risk.risk_score}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  {risk.category && <span>Category: {risk.category}</span>}
                  {risk.probability && (
                    <span>Probability: {risk.probability}</span>
                  )}
                  {risk.owner && <span>Owner: {risk.owner}</span>}
                  {risk.due_date && (
                    <span>Due: {formatDate(risk.due_date)}</span>
                  )}
                </div>

                {/* Mitigations */}
                {mitigations.length > 0 && (
                  <div className="border-t border-gray-800 pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Mitigations
                    </p>
                    <div className="space-y-1">
                      {mitigations.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded px-2 py-1 text-xs bg-gray-800/30"
                        >
                          <span className="text-gray-300">{m.action}</span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            {m.assigned_to && <span>{m.assigned_to}</span>}
                            {m.status && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 ${statusStyle(
                                  m.status
                                )}`}
                              >
                                {m.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
