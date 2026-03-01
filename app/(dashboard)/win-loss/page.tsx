import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function resultStyle(result: string | null): string {
  switch (result?.toLowerCase()) {
    case 'won':
    case 'win':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'lost':
    case 'loss':
      return 'bg-red-500/15 text-red-300'
    case 'no_bid':
    case 'no bid':
      return 'bg-slate-500/15 text-slate-300'
    case 'protest':
      return 'bg-amber-500/15 text-amber-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function WinLossPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'pipeline', 'canView')) return null

  const { data: records } = await supabase
    .from('win_loss_records')
    .select(
      'id, opportunity_id, result, loss_reasons, win_themes, lessons_learned, competitor_winner, contract_value, debrief_date, fiscal_year, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch lessons learned
  const { data: lessons } = await supabase
    .from('lessons_learned')
    .select(
      'id, title, description, category, impact_area, recommendation, outcome, source_phase, tags, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  const winLossItems = records ?? []
  const lessonItems = lessons ?? []

  const wins = winLossItems.filter(
    (r) => r.result === 'won' || r.result === 'win'
  ).length
  const losses = winLossItems.filter(
    (r) => r.result === 'lost' || r.result === 'loss'
  ).length
  const winRate =
    wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Win/Loss Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track outcomes, analyze patterns, and build a searchable lessons
          learned repository.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Total Records</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {winLossItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Wins</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{wins}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Losses</p>
          <p className="mt-1 text-lg font-bold text-red-400">{losses}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="mt-1 text-lg font-bold text-foreground">{winRate}%</p>
        </div>
      </div>

      {/* Win/Loss Records */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Outcomes
        </h2>
        {winLossItems.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No win/loss records yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {winLossItems.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-border bg-card/50 p-5 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {rec.result && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${resultStyle(rec.result)}`}
                      >
                        {rec.result}
                      </span>
                    )}
                    {rec.fiscal_year != null && (
                      <span className="text-xs text-muted-foreground">
                        FY{rec.fiscal_year}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {rec.contract_value && (
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(Number(rec.contract_value))}
                      </span>
                    )}
                    {rec.created_at && (
                      <span>
                        {new Date(rec.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {rec.competitor_winner && (
                  <p className="text-xs text-muted-foreground">
                    Winner: {rec.competitor_winner}
                  </p>
                )}

                {rec.win_themes && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Win Themes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(rec.win_themes)}
                    </p>
                  </div>
                )}

                {rec.loss_reasons && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Loss Reasons
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(rec.loss_reasons)}
                    </p>
                  </div>
                )}

                {rec.lessons_learned && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Lessons Learned
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.lessons_learned}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lessons Learned Library */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lessons Learned Library ({lessonItems.length})
        </h2>
        {lessonItems.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No lessons captured yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card/50">
            {lessonItems.map((lesson) => (
              <div key={lesson.id} className="p-4 space-y-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {lesson.category && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {lesson.category}
                      </span>
                    )}
                    {lesson.impact_area && lesson.impact_area.length > 0 && (
                      <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan">
                        {lesson.impact_area.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground">{lesson.description}</p>
                )}
                {lesson.recommendation && (
                  <p className="text-xs text-emerald-400/80 bg-emerald-500/5 rounded p-2">
                    Recommendation: {lesson.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
