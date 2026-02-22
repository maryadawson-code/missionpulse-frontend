import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'submitted':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'pending_approval':
    case 'pending':
      return 'bg-amber-500/15 text-amber-300'
    case 'draft':
      return 'bg-blue-500/15 text-blue-300'
    case 'rejected':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function QAPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
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

  const { data: questions } = await supabase
    .from('qa_questions')
    .select(
      'id, question_number, question_text, category, response_text, status, assigned_to, due_date, source, submitted_at'
    )
    .eq('opportunity_id', id)
    .order('question_number', { ascending: true })

  const items = questions ?? []

  // Summary stats
  const answered = items.filter(
    (q) => q.status === 'approved' || q.status === 'submitted'
  ).length
  const pending = items.filter(
    (q) => q.status === 'draft' || q.status === 'pending' || q.status === 'pending_approval'
  ).length
  const overdue = items.filter(
    (q) =>
      q.due_date &&
      new Date(q.due_date) < new Date() &&
      q.status !== 'approved' &&
      q.status !== 'submitted'
  ).length

  // Group by category
  const categories = Array.from(new Set(items.map((q) => q.category ?? 'Uncategorized')))

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Q&A' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">RFP Questions & Answers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and respond to RFP questions for {opp.title}.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Questions</p>
          <p className="mt-1 text-lg font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Answered</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{answered}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-400">{pending}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className="mt-1 text-lg font-bold text-red-400">{overdue}</p>
        </div>
      </div>

      {/* Questions */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No RFP questions tracked for this opportunity yet. Add questions from the
            RFP to assign and track responses.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catQuestions = items.filter(
              (q) => (q.category ?? 'Uncategorized') === cat
            )
            return (
              <div key={cat} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {cat} ({catQuestions.length})
                </h2>
                <div className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-900/50">
                  {catQuestions.map((q) => (
                    <div key={q.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {q.question_number && (
                              <span className="text-xs font-mono text-gray-500">
                                Q{q.question_number}
                              </span>
                            )}
                            <p className="text-sm font-medium text-white">
                              {q.question_text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {q.status && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(q.status)}`}
                            >
                              {q.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {q.response_text && (
                        <div className="rounded bg-gray-900/30 p-3">
                          <p className="text-xs text-gray-300 whitespace-pre-wrap">
                            {q.response_text}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        {q.assigned_to && <span>Assigned: {q.assigned_to}</span>}
                        {q.due_date && (
                          <span
                            className={
                              new Date(q.due_date) < new Date() &&
                              q.status !== 'approved' &&
                              q.status !== 'submitted'
                                ? 'text-red-400'
                                : ''
                            }
                          >
                            Due:{' '}
                            {new Date(q.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        {q.source && <span>Source: {q.source}</span>}
                        {q.submitted_at && (
                          <span>
                            Submitted:{' '}
                            {new Date(q.submitted_at).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric' }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
