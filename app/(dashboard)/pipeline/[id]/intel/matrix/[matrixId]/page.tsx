import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

export default async function MatrixDetailPage({
  params,
}: {
  params: { id: string; matrixId: string }
}) {
  const { id, matrixId } = params
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

  const { data: matrix } = await supabase
    .from('competitive_matrix')
    .select('id, matrix_name, description, status')
    .eq('id', matrixId)
    .single()

  if (!matrix) notFound()

  // Fetch criteria
  const { data: criteria } = await supabase
    .from('matrix_criteria')
    .select('id, criteria_name, category, weight, our_score, our_notes, sort_order')
    .eq('matrix_id', matrixId)
    .order('sort_order', { ascending: true })

  // Fetch competitors
  const { data: competitors } = await supabase
    .from('matrix_competitors')
    .select('id, competitor_name, competitor_type, strengths, weaknesses')
    .eq('matrix_id', matrixId)
    .order('competitor_name', { ascending: true })

  // Fetch scores
  const { data: scores } = await supabase
    .from('matrix_scores')
    .select('id, competitor_id, criteria_id, score, notes')
    .eq('matrix_id', matrixId)

  const criteriaItems = criteria ?? []
  const competitorItems = competitors ?? []
  const scoreItems = scores ?? []

  // Build score lookup: scoreMap[competitorId][criteriaId] = score
  const scoreMap: Record<string, Record<string, number | null>> = {}
  for (const s of scoreItems) {
    if (!s.competitor_id || !s.criteria_id) continue
    if (!scoreMap[s.competitor_id]) scoreMap[s.competitor_id] = {}
    scoreMap[s.competitor_id][s.criteria_id] = s.score
  }

  // Calculate weighted totals
  function calcTotal(competitorId: string): number {
    let total = 0
    for (const c of criteriaItems) {
      const score = scoreMap[competitorId]?.[c.id] ?? 0
      const weight = c.weight ?? 1
      total += score * weight
    }
    return Math.round(total * 10) / 10
  }

  function calcOurTotal(): number {
    let total = 0
    for (const c of criteriaItems) {
      const score = c.our_score ?? 0
      const weight = c.weight ?? 1
      total += score * weight
    }
    return Math.round(total * 10) / 10
  }

  const ourTotal = calcOurTotal()

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Intel', href: `/pipeline/${id}/intel` },
          { label: matrix.matrix_name },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">{matrix.matrix_name}</h1>
        {matrix.description && (
          <p className="mt-1 text-sm text-gray-500">{matrix.description}</p>
        )}
      </div>

      {criteriaItems.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No criteria defined for this matrix yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-3 py-2 text-left font-medium text-gray-400">
                  Criteria
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-400 w-16">
                  Weight
                </th>
                <th className="px-3 py-2 text-center font-medium text-cyan w-20">
                  Us
                </th>
                {competitorItems.map((comp) => (
                  <th
                    key={comp.id}
                    className="px-3 py-2 text-center font-medium text-gray-400 w-20"
                  >
                    {comp.competitor_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteriaItems.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/20"
                >
                  <td className="px-3 py-2">
                    <div className="text-sm text-white">{c.criteria_name}</div>
                    {c.category && (
                      <span className="text-[10px] text-gray-500">
                        {c.category}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-400">
                    {c.weight ?? 1}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`font-bold ${
                        (c.our_score ?? 0) >= 4
                          ? 'text-emerald-400'
                          : (c.our_score ?? 0) >= 3
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }`}
                    >
                      {c.our_score ?? '—'}
                    </span>
                  </td>
                  {competitorItems.map((comp) => {
                    const score = scoreMap[comp.id]?.[c.id]
                    return (
                      <td key={comp.id} className="px-3 py-2 text-center text-gray-300">
                        {score ?? '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="border-t-2 border-gray-700 bg-gray-900/60">
                <td className="px-3 py-2 font-semibold text-white">
                  Weighted Total
                </td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-center font-bold text-cyan">
                  {ourTotal}
                </td>
                {competitorItems.map((comp) => (
                  <td
                    key={comp.id}
                    className="px-3 py-2 text-center font-bold text-gray-300"
                  >
                    {calcTotal(comp.id)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Competitor Profiles */}
      {competitorItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Competitor Profiles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {competitorItems.map((comp) => (
              <div
                key={comp.id}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {comp.competitor_name}
                  </h3>
                  {comp.competitor_type && (
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                      {comp.competitor_type}
                    </span>
                  )}
                  <span className="ml-auto text-sm font-bold text-gray-400">
                    {calcTotal(comp.id)}
                  </span>
                </div>
                {comp.strengths && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-400">
                      Strengths
                    </p>
                    <p className="text-xs text-gray-400">{comp.strengths}</p>
                  </div>
                )}
                {comp.weaknesses && (
                  <div>
                    <p className="text-[10px] font-semibold text-red-400">
                      Weaknesses
                    </p>
                    <p className="text-xs text-gray-400">{comp.weaknesses}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
