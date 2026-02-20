// filepath: app/(dashboard)/war-room/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PwinGauge } from '@/components/modules/WarRoom/PwinGauge'
import { WarRoomTabs } from '@/components/modules/WarRoom/WarRoomTabs'

interface WarRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function WarRoomPage({ params }: WarRoomPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch opportunity (RLS-enforced)
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  // Fetch user profile for RBAC
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'viewer'

  // Sensitive access check — matches can_access_sensitive() DB function
  const sensitiveRoles = [
    'executive',
    'operations',
    'admin',
    'CEO',
    'COO',
    'FIN',
  ]
  const canAccessSensitive = sensitiveRoles.includes(userRole)

  // Fetch team assignments
  // Schema: id, assignee_name, assignee_email, opportunity_id, role, created_at
  const { data: rawAssignments } = await supabase
    .from('opportunity_assignments')
    .select('id, role, assignee_name, assignee_email')
    .eq('opportunity_id', id)

  const assignments = (rawAssignments ?? []).map((assignment) => ({
    id: assignment.id,
    role: assignment.role,
    profile: {
      full_name: assignment.assignee_name,
      email: assignment.assignee_email,
    },
  }))

  // Status badge color
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">
              {opportunity.title}
            </h1>
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(opportunity.status)}`}
            >
              {opportunity.status ?? 'Active'}
            </span>
          </div>
          {opportunity.nickname && (
            <p className="text-sm text-slate">{opportunity.nickname}</p>
          )}
          <p className="text-xs text-slate mt-1">
            {opportunity.agency ?? 'No agency'} · {opportunity.phase ?? 'Gate 1'} ·{' '}
            {opportunity.set_aside ?? 'No set-aside'}
          </p>
        </div>

        {/* pWin Gauge */}
        <div className="flex-shrink-0">
          <PwinGauge value={opportunity.pwin ?? 50} />
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Contract Value',
            value: opportunity.ceiling
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(Number(opportunity.ceiling))
              : '—',
          },
          {
            label: 'Due Date',
            value: opportunity.due_date
              ? new Date(opportunity.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—',
          },
          { label: 'Priority', value: opportunity.priority ?? 'Medium' },
          {
            label: 'Go/No-Go',
            value: opportunity.go_no_go ?? 'Pending',
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-md border border-border bg-surface px-4 py-3"
          >
            <dt className="text-xs text-slate">{label}</dt>
            <dd className="text-sm font-medium text-white mt-0.5">{value}</dd>
          </div>
        ))}
      </div>

      {/* Edit link */}
      <div>
        <a
          href={`/pipeline/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-slate hover:text-white hover:border-cyan/30 transition-colors"
        >
          ✏ Edit Opportunity
        </a>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <WarRoomTabs
          opportunity={opportunity}
          assignments={assignments}
          canAccessSensitive={canAccessSensitive}
        />
      </div>
    </div>
  )
}
