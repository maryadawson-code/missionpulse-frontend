import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'War Room — MissionPulse',
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'Won':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'Lost':
      return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'No-Bid':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    default:
      return 'bg-cyan/10 text-cyan border-cyan/30'
  }
}

export default async function WarRoomHubPage() {
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

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, agency, status, phase, pwin, due_date, priority')
    .order('due_date', { ascending: true })
    .limit(50)

  const items = (opportunities ?? []).filter(
    (o) => o.status !== 'Won' && o.status !== 'Lost' && o.status !== 'No-Bid'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">War Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active proposal war rooms. Select an opportunity to enter its war room.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No active opportunities. Create one from the Pipeline to start a war
            room.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((opp) => (
            <Link
              key={opp.id}
              href={`/war-room/${opp.id}`}
              className="group rounded-xl border border-border bg-card/50 p-5 space-y-3 hover:border-cyan/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-cyan transition-colors">
                    {opp.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {opp.agency ?? 'No agency'}
                  </p>
                </div>
                {opp.pwin != null && (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                      opp.pwin >= 60
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : opp.pwin >= 30
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-red-500/15 text-red-300'
                    }`}
                  >
                    {opp.pwin}%
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {opp.status && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor(opp.status)}`}
                  >
                    {opp.status}
                  </span>
                )}
                {opp.phase && <span>{opp.phase}</span>}
                {opp.priority && <span>Priority: {opp.priority}</span>}
                {opp.due_date && (
                  <span>
                    Due:{' '}
                    {new Date(opp.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
