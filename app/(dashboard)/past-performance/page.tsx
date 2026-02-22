import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function ratingStyle(rating: string | null): string {
  switch (rating?.toLowerCase()) {
    case 'exceptional':
    case 'outstanding':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'very good':
    case 'satisfactory':
      return 'bg-blue-500/15 text-blue-300'
    case 'marginal':
      return 'bg-amber-500/15 text-amber-300'
    case 'unsatisfactory':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function PastPerformancePage() {
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
    .from('past_performance')
    .select(
      'id, contract_title, contract_number, client_agency, contract_value, period_start, period_end, cpars_rating, relevance_score, contract_type, description, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  const items = records ?? []

  const totalValue = items.reduce(
    (s, r) => s + (r.contract_value ? Number(r.contract_value) : 0),
    0
  )
  const avgRelevance =
    items.length > 0
      ? Math.round(
          items.reduce((s, r) => s + (r.relevance_score ?? 0), 0) / items.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Past Performance Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track contract history, CPARS ratings, and relevance for future proposals.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Records</p>
          <p className="mt-1 text-lg font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="mt-1 text-lg font-bold text-white">
            {totalValue > 0
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(totalValue)
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Avg Relevance</p>
          <p className="mt-1 text-lg font-bold text-white">{avgRelevance}%</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Exceptional</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {items.filter(
              (r) =>
                r.cpars_rating === 'exceptional' ||
                r.cpars_rating === 'outstanding'
            ).length}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No past performance records yet. Add contract history to build your
            performance library.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {rec.contract_title}
                    </h3>
                    {rec.cpars_rating && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ratingStyle(rec.cpars_rating)}`}
                      >
                        {rec.cpars_rating}
                      </span>
                    )}
                  </div>
                  {rec.client_agency && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {rec.client_agency}
                      {rec.contract_number && ` · ${rec.contract_number}`}
                    </p>
                  )}
                </div>
                {rec.relevance_score != null && (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                      rec.relevance_score >= 80
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : rec.relevance_score >= 50
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-slate-500/15 text-slate-300'
                    }`}
                  >
                    {rec.relevance_score}%
                  </div>
                )}
              </div>

              {rec.description && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {rec.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                {rec.contract_value && (
                  <span>
                    Value:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(Number(rec.contract_value))}
                  </span>
                )}
                {rec.period_start && (
                  <span>
                    PoP:{' '}
                    {new Date(rec.period_start).toLocaleDateString(
                      'en-US',
                      { month: 'short', year: 'numeric' }
                    )}
                    {rec.period_end &&
                      ` – ${new Date(
                        rec.period_end
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}`}
                  </span>
                )}
                {rec.contract_type && <span>Type: {rec.contract_type}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
