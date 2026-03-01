import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'passed':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'scheduled':
    case 'in_progress':
      return 'bg-amber-500/15 text-amber-300'
    case 'cancelled':
    case 'failed':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function InterviewPrepPage({
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

  // Fetch interview preps
  const { data: interviews } = await supabase
    .from('interview_prep')
    .select(
      'id, candidate_name, position_title, interview_type, interview_date, status, overall_score, recommendation, evaluator_names, notes'
    )
    .eq('opportunity_id', id)
    .order('interview_date', { ascending: false })

  const interviewItems = interviews ?? []

  // Fetch questions for all interviews
  const interviewIds = interviewItems.map((i) => i.id)
  const questionsMap: Record<
    string,
    { id: string; question_text: string; question_category: string | null; score: number | null; expected_response: string | null; actual_response: string | null }[]
  > = {}

  if (interviewIds.length > 0) {
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('id, interview_id, question_text, question_category, score, expected_response, actual_response, sort_order')
      .in('interview_id', interviewIds)
      .order('sort_order', { ascending: true })

    for (const q of questions ?? []) {
      if (!q.interview_id) continue
      if (!questionsMap[q.interview_id]) questionsMap[q.interview_id] = []
      questionsMap[q.interview_id].push(q)
    }
  }

  const avgScore =
    interviewItems.length > 0
      ? Math.round(
          interviewItems.reduce(
            (s, i) => s + (i.overall_score ?? 0),
            0
          ) / interviewItems.length
        )
      : 0

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Interview Prep' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Interview Preparation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Prep candidates, track questions, and score practice sessions for{' '}
          {opp.title}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Sessions</p>
          <p className="mt-1 text-lg font-bold text-white">
            {interviewItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Avg Score</p>
          <p className="mt-1 text-lg font-bold text-white">{avgScore}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {interviewItems.filter((i) => i.status === 'completed').length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Scheduled</p>
          <p className="mt-1 text-lg font-bold text-amber-400">
            {interviewItems.filter((i) => i.status === 'scheduled').length}
          </p>
        </div>
      </div>

      {interviewItems.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No interview prep sessions created yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviewItems.map((interview) => {
            const questions = questionsMap[interview.id] ?? []
            return (
              <div
                key={interview.id}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {interview.candidate_name}
                      </h3>
                      {interview.position_title && (
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                          {interview.position_title}
                        </span>
                      )}
                      {interview.status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(interview.status)}`}
                        >
                          {interview.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-500">
                      {interview.interview_type && (
                        <span>Type: {interview.interview_type}</span>
                      )}
                      {interview.interview_date && (
                        <span>
                          {new Date(interview.interview_date).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      )}
                      {interview.evaluator_names &&
                        interview.evaluator_names.length > 0 && (
                          <span>
                            Evaluators: {interview.evaluator_names.join(', ')}
                          </span>
                        )}
                    </div>
                  </div>
                  {interview.overall_score != null && (
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        interview.overall_score >= 4
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : interview.overall_score >= 3
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {interview.overall_score}
                    </div>
                  )}
                </div>

                {interview.recommendation && (
                  <p className="text-xs text-emerald-400/80 bg-emerald-500/5 rounded p-2">
                    {interview.recommendation}
                  </p>
                )}

                {questions.length > 0 && (
                  <div className="border-t border-gray-800 pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Questions ({questions.length})
                    </p>
                    <div className="space-y-1">
                      {questions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between rounded px-2 py-1 text-xs bg-gray-800/30"
                        >
                          <span className="text-gray-300 flex-1">
                            {q.question_text}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 ml-2">
                            {q.question_category && (
                              <span className="rounded bg-gray-700 px-1 py-0.5">
                                {q.question_category}
                              </span>
                            )}
                            {q.score != null && (
                              <span
                                className={`font-bold ${
                                  q.score >= 4
                                    ? 'text-emerald-400'
                                    : q.score >= 3
                                      ? 'text-amber-400'
                                      : 'text-red-400'
                                }`}
                              >
                                {q.score}
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
