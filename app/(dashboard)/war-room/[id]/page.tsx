// filepath: app/(dashboard)/war-room/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission, getAllowedAgents } from '@/lib/rbac/config'
import { PwinGauge } from '@/components/modules/WarRoom/PwinGauge'
import { WarRoomTabs } from '@/components/modules/WarRoom/WarRoomTabs'
import { ColorTeamFeedback } from '@/components/features/proposals/ColorTeamFeedback'
import { ActivityLog } from '@/components/features/shared/ActivityLog'

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
    .select('role, email')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'viewer'
  const role = resolveRole(userRole)
  if (!hasPermission(role, 'pipeline', 'canView')) return null
  const allowedAgents = getAllowedAgents(role)

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

  // Fetch team assignments (schema: id, role, assignee_email, assignee_name)
  const { data: rawAssignments } = await supabase
    .from('opportunity_assignments')
    .select('id, role, assignee_email, assignee_name')
    .eq('opportunity_id', id)

  // Ownership/assignment gate — user must own OR be assigned OR have sensitive role
  const isOwner = opportunity.owner_id === user.id
  const isAssigned = (rawAssignments ?? []).some(
    (a) => a.assignee_email === (profile?.email ?? user.email)
  )
  if (!isOwner && !isAssigned && !canAccessSensitive) return null

  // Resolve profiles for assignments by email
  const assignments: {
    id: string
    role: string | null
    profile: {
      id: string
      full_name: string | null
      email: string
      role: string | null
    } | null
  }[] = []

  for (const assignment of rawAssignments ?? []) {
    let resolvedProfile: {
      id: string
      full_name: string | null
      email: string
      role: string | null
    } | null = null

    if (assignment.assignee_email) {
      const { data: assignedProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', assignment.assignee_email)
        .single()

      resolvedProfile = assignedProfile
    }

    // Fallback: create display-only stub from assignment data
    if (!resolvedProfile && assignment.assignee_email) {
      resolvedProfile = {
        id: '',
        full_name: assignment.assignee_name,
        email: assignment.assignee_email,
        role: assignment.role,
      }
    }

    assignments.push({
      id: assignment.id,
      role: assignment.role,
      profile: resolvedProfile,
    })
  }

  // Fetch proposal volumes for progress tracking
  const { data: volumes } = await supabase
    .from('proposal_volumes')
    .select('id, volume_name, volume_number, page_limit, current_pages, compliance_score, status')
    .eq('opportunity_id', id)
    .order('volume_number', { ascending: true })

  // Fetch color team reviews for this opportunity
  const { data: colorReviews } = await supabase
    .from('color_team_reviews')
    .select('id, review_name, review_type, status, overall_rating, lead_reviewer_name, scheduled_date')
    .eq('opportunity_id', id)
    .order('scheduled_date', { ascending: true })

  const reviewIds = (colorReviews ?? []).map((r) => r.id)
  let colorFindings: { id: string; review_id: string | null; description: string; severity: string | null; finding_type: string | null; reviewer_name: string | null; status: string | null; recommendation: string | null; page_number: number | null; created_at: string | null }[] = []
  if (reviewIds.length > 0) {
    const { data } = await supabase
      .from('color_team_findings')
      .select('id, review_id, description, severity, finding_type, reviewer_name, status, recommendation, page_number, created_at')
      .in('review_id', reviewIds)
      .order('created_at', { ascending: true })
    colorFindings = data ?? []
  }

  // Fetch color team reviewers
  let colorReviewers: { id: string; review_id: string | null; user_name: string; role: string | null; status: string | null; section_assigned: string | null; findings_submitted: number | null }[] = []
  if (reviewIds.length > 0) {
    const { data: reviewerData } = await supabase
      .from('color_team_reviewers')
      .select('id, review_id, user_name, role, status, section_assigned, findings_submitted')
      .in('review_id', reviewIds)
    colorReviewers = reviewerData ?? []
  }

  const reviewsWithFindings = (colorReviews ?? []).map((r) => ({
    ...r,
    findings: colorFindings.filter((f) => f.review_id === r.id),
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

      {/* Action Links */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`/pipeline/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-slate hover:text-white hover:border-cyan/30 transition-colors"
        >
          ✏ Edit Opportunity
        </a>
      </div>

      {/* Sub-Page Navigation */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Proposal Workbench
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { href: `/pipeline/${id}/shredder`, label: 'RFP Shredder', icon: '📄', desc: 'Extract requirements from RFP' },
            { href: `/pipeline/${id}/compliance`, label: 'Compliance Matrix', icon: '🛡', desc: 'Track requirements status' },
            { href: `/pipeline/${id}/contracts`, label: 'Contract Scanner', icon: '📋', desc: 'FAR/DFARS clause analysis' },
            { href: `/pipeline/${id}/documents`, label: 'Documents', icon: '📁', desc: 'Proposal volume files' },
            { href: `/pipeline/${id}/pricing`, label: 'Pricing', icon: '💰', desc: 'Cost model & LCATs' },
            { href: `/pipeline/${id}/strategy`, label: 'Strategy', icon: '🎯', desc: 'Competitive analysis' },
            { href: `/pipeline/${id}/team`, label: 'Team', icon: '👥', desc: 'Manage assignments' },
            { href: `/pipeline/${id}/swimlane`, label: 'Swimlane', icon: '📊', desc: 'Section task board' },
            { href: `/pipeline/${id}/launch`, label: 'Launch Checklist', icon: '🚀', desc: 'Pre-submission launch checklist' },
            { href: `/pipeline/${id}/orals`, label: 'Orals Prep', icon: '🎤', desc: 'Oral presentation prep' },
            { href: `/pipeline/${id}/volumes`, label: 'Volumes', icon: '📚', desc: 'Volume page tracking' },
            { href: `/pipeline/${id}/qa`, label: 'Q&A', icon: '❓', desc: 'RFP question responses' },
            { href: `/pipeline/${id}/risks`, label: 'Risks', icon: '⚠️', desc: 'Risk register & mitigations' },
            { href: `/pipeline/${id}/intel`, label: 'Intel', icon: '🔍', desc: 'Competitive intelligence' },
            { href: `/pipeline/${id}/post-award`, label: 'Post-Award', icon: '🏆', desc: 'Post-award transition' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-md border border-border bg-navy px-3 py-3 hover:border-cyan/40 hover:bg-elevated transition-colors group"
            >
              <span className="text-lg mt-0.5">{link.icon}</span>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-slate mt-0.5">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* AI Agents — filtered by role's allowedAgents */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          AI Agents
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
          {[
            { href: `/pipeline/${id}#capture`, label: 'Capture Analysis', icon: '✨', desc: 'pWin scoring & win themes', agent: 'capture' },
            { href: `/pipeline/${id}/strategy`, label: 'Strategy Generator', icon: '🎯', desc: 'Discriminators & Section M', agent: 'strategy' },
            { href: `/pipeline/${id}/contracts`, label: 'Clause Analyzer', icon: '⚖️', desc: 'FAR/DFARS risk assessment', agent: 'contracts' },
            { href: `/pipeline/${id}/orals`, label: 'Orals Coach', icon: '🎤', desc: 'Evaluator Q&A generation', agent: 'orals' },
            { href: `/pipeline/${id}/pricing`, label: 'Pricing AI', icon: '🧮', desc: 'BOE & price-to-win', agent: 'pricing' },
            { href: `/ai-chat`, label: 'AI Chat', icon: '💬', desc: 'Ask questions about this opp', agent: 'chat' },
          ].filter((link) => link.agent === 'chat' || allowedAgents.includes(link.agent)).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-md border border-border bg-navy px-3 py-3 hover:border-cyan/40 hover:bg-elevated transition-colors group"
            >
              <span className="text-lg mt-0.5">{link.icon}</span>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-slate mt-0.5">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Proposal Volumes Progress */}
      {(volumes ?? []).length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Proposal Volumes
          </h3>
          <div className="space-y-3">
            {(volumes ?? []).map((vol) => {
              const pct =
                vol.page_limit && vol.page_limit > 0
                  ? Math.min(
                      100,
                      Math.round(((vol.current_pages ?? 0) / vol.page_limit) * 100)
                    )
                  : 0
              const barColor =
                pct >= 95
                  ? 'bg-red-500'
                  : pct >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              return (
                <div key={vol.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Vol {vol.volume_number}: {vol.volume_name}
                      </span>
                      {vol.status && (
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                          {vol.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {vol.compliance_score != null && (
                        <span>
                          Compliance: {Math.round(vol.compliance_score)}%
                        </span>
                      )}
                      <span>
                        {vol.current_pages ?? 0}/{vol.page_limit ?? '—'} pages
                      </span>
                    </div>
                  </div>
                  {vol.page_limit && vol.page_limit > 0 && (
                    <div className="h-1.5 w-full rounded-full bg-gray-800">
                      <div
                        className={`h-1.5 rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Color Team Reviews */}
      {reviewsWithFindings.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Color Team Reviews
          </h3>
          <ColorTeamFeedback reviews={reviewsWithFindings} />

          {/* Reviewers Panel */}
          {colorReviewers.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Reviewers ({colorReviewers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {colorReviewers.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/50 px-2.5 py-1"
                  >
                    <span className="text-xs text-white">{r.user_name}</span>
                    {r.role && (
                      <span className="text-[10px] text-gray-500">{r.role}</span>
                    )}
                    {r.status && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.status === 'completed'
                            ? 'bg-emerald-400'
                            : r.status === 'in_progress'
                              ? 'bg-amber-400'
                              : 'bg-gray-500'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Recent Activity
        </h3>
        <ActivityLog entityId={id} realtime />
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
