import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { OralsPrep } from '@/components/features/orals/OralsPrep'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OralsPage({ params }: Props) {
  const { id } = await params
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
  if (!hasPermission(role, 'proposals', 'shouldRender')) {
    return null
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, agency, description')
    .eq('id', id)
    .single()

  if (!opportunity) redirect('/pipeline')

  // Fetch compliance requirements for context
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('requirement')
    .eq('opportunity_id', id)
    .limit(20)

  // Fetch saved questions from question bank
  const { data: savedQuestions } = await supabase
    .from('orals_questions')
    .select('id, question, suggested_answer, category, difficulty, times_asked, avg_score')
    .eq('opportunity_id', id)
    .order('category', { ascending: true })
    .limit(50)

  const questions = savedQuestions ?? []

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Orals' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orals Preparation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated evaluator questions, coaching tips, and speaker notes for{' '}
          {opportunity.title}.
        </p>
      </div>

      <OralsPrep
        opportunity={{
          id: opportunity.id,
          title: opportunity.title ?? '',
          agency: opportunity.agency ?? 'Unknown',
          description: opportunity.description ?? '',
        }}
        requirements={(requirements ?? []).map((r) => r.requirement)}
      />

      {/* Saved Question Bank for This Opportunity */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Question Bank ({questions.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {questions.map((q) => (
              <div key={q.id} className="p-3 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-foreground flex-1">
                    {q.question}
                  </p>
                  <div className="ml-3 flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {q.category}
                    </span>
                    {q.difficulty && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          q.difficulty === 'hard'
                            ? 'bg-red-500/15 text-red-300'
                            : q.difficulty === 'medium'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                {q.suggested_answer && (
                  <p className="text-xs text-muted-foreground bg-card/30 rounded p-2">
                    {q.suggested_answer}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {q.times_asked != null && q.times_asked > 0 && (
                    <span>Practiced {q.times_asked}x</span>
                  )}
                  {q.avg_score != null && (
                    <span>Avg Score: {q.avg_score.toFixed(1)}</span>
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
