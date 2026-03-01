import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'final':
    case 'submitted':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'review':
      return 'bg-amber-500/15 text-amber-300'
    case 'draft':
      return 'bg-blue-500/15 text-blue-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function VolumesPage({
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

  const { data: volumes } = await supabase
    .from('proposal_volumes')
    .select(
      'id, volume_name, volume_number, page_limit, current_pages, compliance_score, status, due_date, owner_id'
    )
    .eq('opportunity_id', id)
    .order('volume_number', { ascending: true })

  // Resolve owner names
  const ownerIds = Array.from(new Set((volumes ?? []).map((v) => v.owner_id).filter(Boolean))) as string[]
  const ownerMap: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ownerIds)
    for (const o of owners ?? []) {
      ownerMap[o.id] = o.full_name ?? o.email
    }
  }

  const items = volumes ?? []

  // Summary stats
  const totalPages = items.reduce((s, v) => s + (v.current_pages ?? 0), 0)
  const totalLimit = items.reduce((s, v) => s + (v.page_limit ?? 0), 0)
  const avgCompliance =
    items.length > 0
      ? Math.round(
          items.reduce((s, v) => s + (v.compliance_score ?? 0), 0) / items.length
        )
      : 0

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Volumes' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Proposal Volumes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track page counts, compliance, and status for each volume of {opp.title}.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Volumes</p>
          <p className="mt-1 text-lg font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Total Pages</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {totalPages}
            {totalLimit > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {totalLimit}
              </span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Avg Compliance</p>
          <p className="mt-1 text-lg font-bold text-foreground">{avgCompliance}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Page Usage</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {totalLimit > 0
              ? `${Math.round((totalPages / totalLimit) * 100)}%`
              : '—'}
          </p>
        </div>
      </div>

      {/* Volume List */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No proposal volumes defined for this opportunity yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((vol) => {
            const pct =
              vol.page_limit && vol.page_limit > 0
                ? Math.min(
                    100,
                    Math.round(
                      ((vol.current_pages ?? 0) / vol.page_limit) * 100
                    )
                  )
                : 0
            const barColor =
              pct >= 95
                ? 'bg-red-500'
                : pct >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            return (
              <div
                key={vol.id}
                className="rounded-xl border border-border bg-card/50 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Volume {vol.volume_number}: {vol.volume_name}
                      </h3>
                      {vol.status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(vol.status)}`}
                        >
                          {vol.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                      {vol.owner_id && ownerMap[vol.owner_id] && (
                        <span>Owner: {ownerMap[vol.owner_id]}</span>
                      )}
                      {vol.due_date && (
                        <span>
                          Due:{' '}
                          {new Date(vol.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {vol.compliance_score != null && (
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        vol.compliance_score >= 80
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : vol.compliance_score >= 50
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {Math.round(vol.compliance_score)}%
                    </div>
                  )}
                </div>

                {/* Page Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page Usage</span>
                    <span>
                      {vol.current_pages ?? 0} / {vol.page_limit ?? '—'} pages
                      {vol.page_limit && vol.page_limit > 0 && (
                        <span className="ml-1 text-muted-foreground">({pct}%)</span>
                      )}
                    </span>
                  </div>
                  {vol.page_limit && vol.page_limit > 0 && (
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
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
