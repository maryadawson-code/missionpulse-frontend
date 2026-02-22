// filepath: app/(dashboard)/pipeline/[id]/team/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { TeamList } from '@/components/features/team/TeamList'
import { PersonnelAssignmentPanel } from '@/components/features/team/PersonnelAssignmentPanel'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
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
  if (!hasPermission(role, 'pipeline', 'canView')) return null

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  const { data: assignments } = await supabase
    .from('opportunity_assignments')
    .select('id, assignee_name, assignee_email, role, created_at')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true })

  // Fetch key personnel for assignment panel
  const { data: keyPersonnel } = await supabase
    .from('key_personnel')
    .select('id, first_name, last_name, title, labor_category, clearance_level, clearance_status, availability_status, skills')
    .limit(100)

  const assignedIds = (assignments ?? []).map((a) => a.id)

  const personnelRecords = (keyPersonnel ?? []).map((kp) => ({
    id: kp.id,
    firstName: kp.first_name,
    lastName: kp.last_name,
    title: kp.title,
    laborCategory: kp.labor_category,
    clearanceLevel: kp.clearance_level,
    clearanceStatus: kp.clearance_status,
    availabilityStatus: kp.availability_status,
    skills: kp.skills,
  }))

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Team' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {(assignments ?? []).length} member{(assignments ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <TeamList
        opportunityId={id}
        assignments={assignments ?? []}
      />

      {/* Personnel Assignment Panel */}
      {personnelRecords.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Key Personnel</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Browse and assign available personnel from the company roster.
          </p>
          <PersonnelAssignmentPanel
            personnel={personnelRecords}
            assignedIds={assignedIds}
          />
        </div>
      )}
    </div>
  )
}
