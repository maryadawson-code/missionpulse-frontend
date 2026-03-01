// filepath: app/(dashboard)/proposals/[id]/breakdown/page.tsx
/**
 * Work Breakdown Page
 *
 * Server Component showing the work breakdown matrix for a proposal.
 * Displays all section assignments grouped by volume, summary statistics,
 * and a per-person rollup of assignments.
 *
 * v1.3 Sprint 31 T-31.2 — Work Breakdown Structure & Section Assignments
 */
import { redirect, notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { createSyncClient } from '@/lib/supabase/sync-client'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { TeamRollup } from '@/components/features/proposals/TeamRollup'
import { Skeleton } from '@/components/ui/skeleton'
const WorkBreakdownMatrix = dynamic(
  () => import('@/components/features/proposals/WorkBreakdownMatrix').then((m) => m.WorkBreakdownMatrix),
  {
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
)

// ─── Summary Card ────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string | number
  accent?: boolean
  subtext?: string
}

function SummaryCard({ label, value, accent, subtext }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          accent
            ? 'mt-1 text-2xl font-bold text-[#00E5FA]'
            : 'mt-1 text-2xl font-bold text-foreground'
        }
      >
        {value}
      </p>
      {subtext && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtext}</p>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatWordCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`
  }
  return `${count}`
}

// ─── Page ────────────────────────────────────────────────────────

export default async function BreakdownPage({
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

  // RBAC
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'shouldRender')) return null

  // Fetch opportunity
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, status')
    .eq('id', id)
    .single()

  if (!opportunity) notFound()

  // Fetch proposal volumes for this opportunity
  const { data: volumeRows } = await supabase
    .from('proposal_volumes')
    .select('id, volume_name, volume_number')
    .eq('opportunity_id', id)
    .order('volume_number', { ascending: true })

  const volumes = volumeRows ?? []

  // Fetch proposal sections for this opportunity
  const { data: sectionRows } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, content')
    .eq('opportunity_id', id)
    .order('sort_order', { ascending: true })

  const sections = (sectionRows ?? []).map((s) => ({
    id: s.id,
    title: s.section_title,
    volume: s.volume,
    status: s.status ?? 'draft',
    content: s.content,
  }))

  // Fetch section assignments (Phase J table)
  const syncClient = await createSyncClient()
  const { data: assignmentRows } = await syncClient
    .from('section_assignments')
    .select('id, section_id, assignee_id, status, word_count, deadline')

  // Filter to only assignments that reference sections in this opportunity
  const sectionIdSet = new Set(sections.map((s) => s.id))
  const assignments = (assignmentRows ?? [])
    .filter((a: Record<string, unknown>) => sectionIdSet.has(a.section_id as string))
    .map((a: Record<string, unknown>) => ({
      section_id: a.section_id as string,
      assignee_id: a.assignee_id as string,
      status: a.status as string,
      word_count: (a.word_count as number) ?? 0,
      deadline: (a.deadline as string) ?? null,
    }))

  // Collect unique assignee IDs to fetch profiles
  const assigneeIds = Array.from(new Set(assignments.map((a) => a.assignee_id)))

  let teamMembers: { id: string; full_name: string | null; email: string; avatar_url: string | null }[] = []
  if (assigneeIds.length > 0) {
    const { data: memberRows } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', assigneeIds)

    teamMembers = (memberRows ?? []).map((m) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      avatar_url: m.avatar_url,
    }))
  }

  // ─── Compute Summary Stats ──────────────────────────────────

  const totalSections = sections.length
  const assignedSections = assignments.length
  const assignedPct =
    totalSections > 0 ? Math.round((assignedSections / totalSections) * 100) : 0
  const inProgressCount = assignments.filter((a) => a.status === 'in_progress').length
  const completedCount = assignments.filter((a) => a.status === 'complete').length
  const totalWordCount = assignments.reduce((sum, a) => sum + a.word_count, 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Proposals', href: '/proposals' },
          { label: opportunity.title, href: `/proposals/${id}` },
          { label: 'Work Breakdown' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Work Breakdown &mdash; {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Section assignments, word counts, and deadlines across all volumes.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Total Sections" value={totalSections} />
        <SummaryCard
          label="Assigned"
          value={`${assignedPct}%`}
          subtext={`${assignedSections} of ${totalSections}`}
        />
        <SummaryCard
          label="In Progress"
          value={inProgressCount}
          accent
        />
        <SummaryCard label="Completed" value={completedCount} />
        <SummaryCard
          label="Word Count"
          value={formatWordCount(totalWordCount)}
          subtext="across all sections"
        />
      </div>

      {/* Work Breakdown Matrix */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[#00E5FA]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          <h2 className="text-sm font-semibold text-foreground">
            Assignment Matrix
          </h2>
        </div>

        <WorkBreakdownMatrix
          volumes={volumes}
          sections={sections}
          assignments={assignments}
          teamMembers={teamMembers}
        />
      </section>

      {/* Team Rollup */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[#00E5FA]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <h2 className="text-sm font-semibold text-foreground">
            Team Rollup
          </h2>
        </div>

        <TeamRollup
          assignments={assignments}
          teamMembers={teamMembers}
          sections={sections.map((s) => ({ id: s.id, title: s.title }))}
        />
      </section>
    </div>
  )
}
