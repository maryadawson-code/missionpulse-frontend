import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'incorporated':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'in_progress':
    case 'pending':
      return 'bg-amber-500/15 text-amber-300'
    case 'overdue':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

function impactStyle(level: string | null): string {
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'bg-red-500/15 text-red-300'
    case 'medium':
      return 'bg-amber-500/15 text-amber-300'
    case 'low':
      return 'bg-emerald-500/15 text-emerald-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function AmendmentsPage({
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

  const { data: amendments } = await supabase
    .from('amendments')
    .select(
      'id, amendment_number, title, amendment_type, status, impact_level, summary, release_date, response_due, sections_affected, assigned_to_name, requires_revision, notes'
    )
    .eq('opportunity_id', id)
    .order('amendment_number', { ascending: true })

  const items = amendments ?? []

  const pending = items.filter(
    (a) => a.status === 'pending' || a.status === 'in_progress'
  ).length
  const overdue = items.filter(
    (a) =>
      a.response_due &&
      new Date(a.response_due) < new Date() &&
      a.status !== 'completed' &&
      a.status !== 'incorporated'
  ).length
  const revisions = items.filter((a) => a.requires_revision === true).length

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Amendments' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Amendment Tracker</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track RFP amendments, response deadlines, and revision requirements for{' '}
          {opp.title}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-1 text-lg font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-400">{pending}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className="mt-1 text-lg font-bold text-red-400">{overdue}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Needs Revision</p>
          <p className="mt-1 text-lg font-bold text-white">{revisions}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No amendments tracked for this opportunity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((amend) => (
            <div
              key={amend.id}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">
                      #{amend.amendment_number}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {amend.title}
                    </h3>
                    {amend.status && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(amend.status)}`}
                      >
                        {amend.status.replace(/_/g, ' ')}
                      </span>
                    )}
                    {amend.impact_level && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${impactStyle(amend.impact_level)}`}
                      >
                        {amend.impact_level}
                      </span>
                    )}
                    {amend.requires_revision && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300">
                        Revision Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {amend.summary && (
                <p className="text-xs text-gray-400">{amend.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                {amend.amendment_type && (
                  <span>Type: {amend.amendment_type}</span>
                )}
                {amend.release_date && (
                  <span>
                    Released:{' '}
                    {new Date(amend.release_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {amend.response_due && (
                  <span
                    className={
                      new Date(amend.response_due) < new Date() &&
                      amend.status !== 'completed' &&
                      amend.status !== 'incorporated'
                        ? 'text-red-400 font-medium'
                        : ''
                    }
                  >
                    Due:{' '}
                    {new Date(amend.response_due).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {amend.assigned_to_name && (
                  <span>Assigned: {amend.assigned_to_name}</span>
                )}
              </div>

              {amend.sections_affected && amend.sections_affected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {amend.sections_affected.map((section, i) => (
                    <span
                      key={i}
                      className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
