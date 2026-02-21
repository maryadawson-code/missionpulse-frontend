import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { IronDomeCards } from '@/components/features/compliance/IronDomeCards'
import { OpportunityComplianceTable } from '@/components/features/compliance/OpportunityComplianceTable'
import { ComplianceGaps } from '@/components/features/compliance/ComplianceGaps'

export default async function IronDomePage() {
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
  if (!hasPermission(role, 'compliance', 'shouldRender')) {
    redirect('/dashboard')
  }

  // Fetch all compliance_requirements across all opportunities
  const { data: allReqs } = await supabase
    .from('compliance_requirements')
    .select('id, opportunity_id, reference, requirement, section, priority, status, assigned_to, created_at, updated_at')
    .order('created_at', { ascending: false })

  // Fetch active opportunities with their titles
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, status, phase, due_date')
    .in('status', ['Active', 'active', null])
    .order('due_date', { ascending: true })

  const reqs = allReqs ?? []
  const opps = opportunities ?? []

  // Aggregate per opportunity
  const oppStats = opps.map((opp) => {
    const oppReqs = reqs.filter((r) => r.opportunity_id === opp.id)
    const addressed = oppReqs.filter(
      (r) => r.status === 'Addressed' || r.status === 'Verified'
    ).length
    const pct = oppReqs.length > 0 ? Math.round((addressed / oppReqs.length) * 100) : 0

    return {
      id: opp.id,
      title: opp.title,
      status: opp.status,
      phase: opp.phase,
      due_date: opp.due_date,
      total: oppReqs.length,
      addressed,
      notStarted: oppReqs.filter((r) => r.status === 'Not Started' || !r.status).length,
      inProgress: oppReqs.filter((r) => r.status === 'In Progress').length,
      verified: oppReqs.filter((r) => r.status === 'Verified').length,
      pct,
    }
  })

  // Global stats
  const totalReqs = reqs.length
  const totalAddressed = reqs.filter(
    (r) => r.status === 'Addressed' || r.status === 'Verified'
  ).length
  const totalVerified = reqs.filter((r) => r.status === 'Verified').length
  const overallPct = totalReqs > 0 ? Math.round((totalAddressed / totalReqs) * 100) : 0

  // Gaps: requirements with status 'Not Started' that have been pending for a while
  const gaps = reqs.filter(
    (r) => !r.status || r.status === 'Not Started'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Iron Dome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compliance command center — track requirements across all active opportunities.
          NIST SP 800-171 / CMMC Level 2.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <IronDomeCards
        totalReqs={totalReqs}
        totalAddressed={totalAddressed}
        totalVerified={totalVerified}
        overallPct={overallPct}
        gapCount={gaps.length}
        activeOpps={opps.length}
      />

      {/* Per-Opportunity Compliance Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Compliance by Opportunity
        </h2>
        <OpportunityComplianceTable opportunities={oppStats} />
      </div>

      {/* Gap Detection */}
      {gaps.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Gaps Detected
          </h2>
          <ComplianceGaps gaps={gaps} opportunities={opps} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {totalReqs} total requirement{totalReqs !== 1 ? 's' : ''} across{' '}
        {opps.length} active opportunit{opps.length !== 1 ? 'ies' : 'y'}.
      </p>
    </div>
  )
}
