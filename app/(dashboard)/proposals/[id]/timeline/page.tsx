// filepath: app/(dashboard)/proposals/[id]/timeline/page.tsx
/**
 * Proposal Timeline Page
 *
 * Server Component displaying milestone management for a proposal.
 * Shows summary KPI cards, a Gantt-style visual timeline, and a
 * detailed milestone list with type icons, dates, and status badges.
 *
 * v1.3 Sprint 31 T-31.1 — Proposal Timeline & Milestones
 */

import { redirect, notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Milestone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createSyncClient } from '@/lib/supabase/sync-client'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { MilestoneBar } from '@/components/features/proposals/MilestoneBar'
import { Skeleton } from '@/components/ui/skeleton'

const GanttTimeline = dynamic(
  () => import('@/components/features/proposals/GanttTimeline').then((m) => m.GanttTimeline),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
  }
)
import {
  sortMilestones,
  formatDate,
} from '@/lib/proposals/timeline-utils'
import type { ProposalMilestone } from '@/lib/types/sync'

// ─── Page ─────────────────────────────────────────────────────────

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth gate
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch opportunity
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title, agency, due_date')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  // Fetch milestones from Phase J table
  const syncClient = await createSyncClient()
  const { data: milestoneRows } = await syncClient
    .from('proposal_milestones')
    .select('*')
    .eq('opportunity_id', id)
    .order('scheduled_date', { ascending: true })

  const milestones: ProposalMilestone[] = (milestoneRows ?? []) as ProposalMilestone[]
  const sorted = sortMilestones(milestones)

  // Collect unique creator IDs for display names
  const creatorIds = Array.from(
    new Set(milestones.map((m) => m.created_by).filter(Boolean) as string[])
  )
  let profileMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds)
    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown'])
    )
  }

  // ─── Summary calculations ──────────────────────────────────────

  const now = new Date()
  const totalCount = milestones.length
  const completedCount = milestones.filter((m) => m.status === 'completed').length
  const upcomingCount = milestones.filter(
    (m) => m.status === 'upcoming' || m.status === 'in_progress'
  ).length
  const overdueCount = milestones.filter(
    (m) =>
      m.status !== 'completed' &&
      m.status !== 'cancelled' &&
      new Date(m.scheduled_date) < now
  ).length

  // ─── KPI Cards data ────────────────────────────────────────────

  const kpis = [
    {
      label: 'Total Milestones',
      value: totalCount,
      icon: CalendarDays,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: AlertTriangle,
      color: overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground',
      bgColor: overdueCount > 0 ? 'bg-red-500/10' : 'bg-muted/10',
    },
  ]

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Proposals', href: '/proposals' },
          { label: opportunity.title, href: `/proposals/${id}` },
          { label: 'Timeline' },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Proposal Timeline &mdash; {opportunity.title}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            {opportunity.agency && <span>{opportunity.agency}</span>}
            {opportunity.due_date && (
              <span>Due: {formatDate(opportunity.due_date)}</span>
            )}
          </div>
        </div>

        {/* Add Milestone placeholder button */}
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bgColor}`}
                >
                  <KpiIcon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gantt Timeline Visualization */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Timeline
          </h2>
        </div>
        <GanttTimeline
          milestones={sorted.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.milestone_type,
            scheduled_date: m.scheduled_date,
            actual_date: m.actual_date,
            status: m.status,
          }))}
        />
      </section>

      {/* Milestone Detail List */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Milestone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            All Milestones
          </h2>
          <span className="text-xs text-muted-foreground">
            ({totalCount})
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No milestones have been created for this proposal yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Milestones track gate reviews, color teams, submission deadlines, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((m) => (
              <MilestoneBar
                key={m.id}
                milestone={{
                  id: m.id,
                  title: m.title,
                  milestone_type: m.milestone_type,
                  scheduled_date: m.scheduled_date,
                  actual_date: m.actual_date,
                  status: m.status,
                  notes: m.notes,
                  created_by_name: m.created_by ? profileMap[m.created_by] ?? null : null,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
