import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export default async function CapacityPage() {
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

  // Fetch resource allocations
  const { data: allocations } = await supabase
    .from('resource_allocations')
    .select(
      'id, user_id, opportunity_id, hours_per_week, allocation_percentage, start_date, end_date, role_on_opportunity, is_confirmed, created_at'
    )
    .order('start_date', { ascending: true })
    .limit(200)

  const items = allocations ?? []

  // Resolve user names
  const userIds = Array.from(new Set(items.map((a) => a.user_id).filter(Boolean))) as string[]
  const userMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    for (const u of users ?? []) {
      userMap[u.id] = u.full_name ?? u.email
    }
  }

  // Resolve opportunity names
  const oppIds = Array.from(new Set(items.map((a) => a.opportunity_id).filter(Boolean))) as string[]
  const oppMap: Record<string, string> = {}
  if (oppIds.length > 0) {
    const { data: opps } = await supabase
      .from('opportunities')
      .select('id, title')
      .in('id', oppIds)
    for (const o of opps ?? []) {
      oppMap[o.id] = o.title
    }
  }

  // Group by user
  const byUser: Record<string, typeof items> = {}
  for (const a of items) {
    const uid = a.user_id ?? 'unassigned'
    if (!byUser[uid]) byUser[uid] = []
    byUser[uid].push(a)
  }

  const userEntries = Object.entries(byUser).sort(([a], [b]) =>
    (userMap[a] ?? a).localeCompare(userMap[b] ?? b)
  )

  // Stats
  const totalAllocations = items.length
  const confirmed = items.filter((a) => a.is_confirmed === true).length
  const overAllocated = userEntries.filter(([, allocs]) => {
    const total = allocs.reduce(
      (s, a) => s + (a.allocation_percentage ?? 0),
      0
    )
    return total > 100
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resource Capacity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View team allocation across opportunities and identify capacity
          constraints.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Allocations</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {totalAllocations}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Team Members</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {userEntries.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Confirmed</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{confirmed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Over-Allocated</p>
          <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
            {overAllocated}
          </p>
        </div>
      </div>

      {userEntries.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No resource allocations tracked yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {userEntries.map(([userId, allocs]) => {
            const totalPct = allocs.reduce(
              (s, a) => s + (a.allocation_percentage ?? 0),
              0
            )
            const isOver = totalPct > 100
            return (
              <div
                key={userId}
                className="rounded-xl border border-border bg-card/50 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {userMap[userId] ?? 'Unassigned'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {allocs.length} allocation
                      {allocs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {totalPct}%
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver
                        ? 'bg-red-500'
                        : totalPct >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, totalPct)}%` }}
                  />
                </div>

                {/* Allocation Breakdown */}
                <div className="space-y-1">
                  {allocs.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded px-2 py-1 text-xs bg-muted/30"
                    >
                      <span className="text-muted-foreground">
                        {a.opportunity_id
                          ? oppMap[a.opportunity_id] ?? 'Unknown Opp'
                          : 'General'}
                        {a.role_on_opportunity && (
                          <span className="ml-1 text-muted-foreground">
                            ({a.role_on_opportunity})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {a.allocation_percentage != null && (
                          <span>{a.allocation_percentage}%</span>
                        )}
                        {a.hours_per_week != null && (
                          <span>{a.hours_per_week}h/wk</span>
                        )}
                        {a.is_confirmed ? (
                          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">
                            confirmed
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                            pending
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
