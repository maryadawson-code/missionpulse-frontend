import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreateDebriefForm } from './CreateDebriefForm'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function outcomeStyle(outcome: string | null): string {
  switch (outcome?.toLowerCase()) {
    case 'won':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'lost':
      return 'bg-red-500/15 text-red-300'
    case 'no_bid':
    case 'no bid':
      return 'bg-amber-500/15 text-amber-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function DebriefsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: debriefs } = await supabase
    .from('debriefs')
    .select(
      'id, opportunity_id, opportunity_name, debrief_type, debrief_date, outcome, contract_value, notes, strengths, weaknesses, lessons_learned, created_at'
    )
    .order('debrief_date', { ascending: false })
    .limit(100)

  const items = debriefs ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Win/Loss Debriefs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture lessons learned from proposal outcomes to improve future win
            rates.
          </p>
        </div>
        <CreateDebriefForm />
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No debriefs recorded yet. Debriefs are created after an opportunity
            reaches a Won, Lost, or No-Bid outcome.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((d) => {
            const strengths = Array.isArray(d.strengths) ? d.strengths : []
            const weaknesses = Array.isArray(d.weaknesses) ? d.weaknesses : []
            const lessons = Array.isArray(d.lessons_learned)
              ? d.lessons_learned
              : []

            return (
              <div
                key={d.id}
                className="rounded-xl border border-border bg-card/50 p-6 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      {d.opportunity_id ? (
                        <Link
                          href={`/pipeline/${d.opportunity_id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {d.opportunity_name ?? 'Unnamed Opportunity'}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          {d.opportunity_name ?? 'Unnamed Opportunity'}
                        </span>
                      )}
                      {d.outcome && (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${outcomeStyle(
                            d.outcome
                          )}`}
                        >
                          {d.outcome}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {d.debrief_type && (
                        <span>{d.debrief_type.replace(/_/g, ' ')}</span>
                      )}
                      <span>{formatDate(d.debrief_date)}</span>
                      {d.contract_value != null && (
                        <span>{formatCurrency(d.contract_value)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {d.notes && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {d.notes}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {strengths.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                        Strengths
                      </h4>
                      <ul className="space-y-0.5">
                        {strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-emerald-500 mt-0.5">+</span>
                            {String(s)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1">
                        Weaknesses
                      </h4>
                      <ul className="space-y-0.5">
                        {weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-red-500 mt-0.5">-</span>
                            {String(w)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lessons.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                        Lessons Learned
                      </h4>
                      <ul className="space-y-0.5">
                        {lessons.map((l, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-amber-500 mt-0.5">*</span>
                            {String(l)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
