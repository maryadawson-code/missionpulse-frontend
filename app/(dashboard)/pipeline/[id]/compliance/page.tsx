import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ComplianceMatrix } from '@/components/features/compliance/ComplianceMatrix'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface CompliancePageProps {
  params: Promise<{ id: string }>
}

export default async function CompliancePage({ params }: CompliancePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'compliance', 'shouldRender')) return null

  // Verify opportunity exists
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  // Fetch compliance requirements
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select(
      'id, reference, requirement, section, priority, status, assigned_to, reviewer, notes, evidence_links, page_reference, volume_reference, verified_at, verified_by, created_at, updated_at'
    )
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true })

  // Fetch team members for assignment
  const { data: teamMembers } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name, assignee_email')
    .eq('opportunity_id', id)

  const reqs = requirements ?? []
  const addressed = reqs.filter(
    (r) => r.status === 'Addressed' || r.status === 'Verified'
  ).length
  const progressPct = reqs.length > 0 ? Math.round((addressed / reqs.length) * 100) : 0

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Compliance' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {reqs.length} requirement{reqs.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Compliance Progress
          </span>
          <span className="text-sm font-semibold text-primary">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>{addressed} addressed</span>
          <span>{reqs.length - addressed} remaining</span>
          <span>{reqs.filter((r) => r.status === 'Verified').length} verified</span>
        </div>
      </div>

      <ComplianceMatrix
        requirements={reqs}
        teamMembers={teamMembers ?? []}
        opportunityId={id}
      />
    </div>
  )
}
