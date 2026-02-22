import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function decisionStyle(decision: string | null): string {
  switch (decision?.toLowerCase()) {
    case 'go':
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'conditional':
    case 'conditional_go':
      return 'bg-amber-500/15 text-amber-300'
    case 'no_go':
    case 'rejected':
      return 'bg-red-500/15 text-red-300'
    case 'pending':
      return 'bg-blue-500/15 text-blue-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function GateReviewsPage({
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

  const { data: reviews } = await supabase
    .from('gate_reviews')
    .select(
      'id, gate_number, gate_name, decision, pwin_at_gate, conditions, created_at'
    )
    .eq('opportunity_id', id)
    .order('gate_number', { ascending: true })

  const items = reviews ?? []

  // Fetch review comments for all gate reviews
  const gateIds = items.map((r) => r.id)
  let commentsMap: Record<string, { id: string; comment_text: string; comment_type: string | null; priority: number | null; section_ref: string | null; status: string | null; recommendation: string | null; response: string | null }[]> = {}
  if (gateIds.length > 0) {
    const { data: comments } = await supabase
      .from('review_comments')
      .select('id, review_id, comment_text, comment_type, priority, section_ref, status, recommendation, response')
      .in('review_id', gateIds)
      .order('priority', { ascending: false })
    for (const c of comments ?? []) {
      if (!c.review_id) continue
      if (!commentsMap[c.review_id]) commentsMap[c.review_id] = []
      commentsMap[c.review_id].push(c)
    }
  }

  const goCount = items.filter(
    (r) => r.decision === 'go' || r.decision === 'approved'
  ).length
  const noGoCount = items.filter(
    (r) => r.decision === 'no_go' || r.decision === 'rejected'
  ).length
  const latestPwin =
    items.length > 0 ? items[items.length - 1].pwin_at_gate : null

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Gate Reviews' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Gate Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Shipley gate review decisions and pWin tracking for {opp.title}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Gates Reviewed</p>
          <p className="mt-1 text-lg font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Go Decisions</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{goCount}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">No-Go</p>
          <p className="mt-1 text-lg font-bold text-red-400">{noGoCount}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Latest pWin</p>
          <p className="mt-1 text-lg font-bold text-white">
            {latestPwin != null ? `${latestPwin}%` : '—'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No gate reviews recorded yet.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-800" />

          <div className="space-y-4">
            {items.map((review) => (
              <div key={review.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    review.decision === 'go' || review.decision === 'approved'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : review.decision === 'no_go' ||
                          review.decision === 'rejected'
                        ? 'border-red-500 bg-red-500/15 text-red-300'
                        : review.decision === 'conditional' ||
                            review.decision === 'conditional_go'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                          : 'border-gray-600 bg-gray-800 text-gray-400'
                  }`}
                >
                  {review.gate_number ?? '?'}
                </div>

                {/* Card */}
                <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {review.gate_name ?? `Gate ${review.gate_number}`}
                      </h3>
                      {review.decision && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${decisionStyle(review.decision)}`}
                        >
                          {review.decision.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      {review.pwin_at_gate != null && (
                        <span className="font-medium text-cyan">
                          pWin: {review.pwin_at_gate}%
                        </span>
                      )}
                      {review.created_at && (
                        <span>
                          {new Date(review.created_at).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {review.conditions && review.conditions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Conditions
                      </p>
                      <ul className="space-y-0.5">
                        {review.conditions.map((condition, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-400 flex items-start gap-1.5"
                          >
                            <span className="mt-1 h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Review Comments */}
                  {(commentsMap[review.id] ?? []).length > 0 && (
                    <div className="border-t border-gray-800 pt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Comments ({commentsMap[review.id].length})
                      </p>
                      <div className="space-y-1">
                        {commentsMap[review.id].map((c) => (
                          <div
                            key={c.id}
                            className="rounded px-2 py-1.5 text-xs bg-gray-800/30 space-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-gray-300 flex-1">{c.comment_text}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {c.comment_type && (
                                  <span className="rounded bg-gray-700 px-1 py-0.5 text-[10px] text-gray-400">
                                    {c.comment_type}
                                  </span>
                                )}
                                {c.status && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                      c.status === 'resolved'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : c.status === 'open'
                                          ? 'bg-red-500/15 text-red-300'
                                          : 'bg-slate-500/15 text-slate-300'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            {c.recommendation && (
                              <p className="text-[10px] text-emerald-400/80">
                                Rec: {c.recommendation}
                              </p>
                            )}
                            {c.response && (
                              <p className="text-[10px] text-blue-300/80">
                                Response: {c.response}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
