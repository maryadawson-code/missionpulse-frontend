import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ProposalDetailClient } from './ProposalDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProposalDetailPage({ params }: Props) {
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
  if (!hasPermission(role, 'proposals', 'shouldRender')) return null
  const canEdit = hasPermission(role, 'proposals', 'canEdit')

  // Fetch outline
  const { data: outline, error } = await supabase
    .from('proposal_outlines')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !outline) notFound()

  // Fetch opportunity title
  let opportunityTitle = ''
  if (outline.opportunity_id) {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('title')
      .eq('id', outline.opportunity_id)
      .single()
    opportunityTitle = opp?.title ?? ''
  }

  // Fetch volumes linked to this opportunity
  const { data: volumes } = await supabase
    .from('proposal_outline_volumes')
    .select('id, title, volume_number, page_limit, sort_order, notes')
    .eq('opportunity_id', outline.opportunity_id ?? '')
    .order('sort_order', { ascending: true })

  // Fetch sections for each volume
  const volumeIds = (volumes ?? []).map((v) => v.id)
  let sections: { id: string; volume_id: string | null; section_title: string; section_number: string; page_allocation: number | null; rfp_reference: string | null; assigned_to: string | null; status: string | null }[] = []
  if (volumeIds.length > 0) {
    const { data } = await supabase
      .from('volume_sections')
      .select('id, volume_id, section_title, section_number, page_allocation, rfp_reference, assigned_to, status')
      .in('volume_id', volumeIds)
      .order('section_number', { ascending: true })
    sections = data ?? []
  }

  // Fetch key personnel for staffing requirements
  const { data: keyPersonnel } = await supabase
    .from('key_personnel')
    .select('id, first_name, last_name, labor_category, clearance_level, availability_status')
    .limit(100)

  // Fetch opportunity assignments to determine filled positions
  const { data: oppAssignments } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name, role')
    .eq('opportunity_id', outline.opportunity_id ?? '')

  // Build staffing requirements from labor categories in key_personnel
  const lcatSet = new Map<string, { assigned: string | null; clearance: string | null }>()
  for (const kp of keyPersonnel ?? []) {
    const lcat = kp.labor_category ?? 'General'
    if (!lcatSet.has(lcat)) {
      lcatSet.set(lcat, { assigned: null, clearance: kp.clearance_level })
    }
  }

  // Map assignments to labor categories
  const assignedNames = new Set((oppAssignments ?? []).map((a) => a.assignee_name))
  const staffingRequirements = Array.from(lcatSet.entries()).map(([lcat, info], idx) => {
    const matchedPerson = (keyPersonnel ?? []).find(
      (kp) => kp.labor_category === lcat && assignedNames.has(`${kp.first_name} ${kp.last_name}`)
    )
    return {
      id: `staff-${idx}`,
      laborCategory: lcat,
      level: null as string | null,
      clearanceRequired: info.clearance,
      assigned: matchedPerson ? `${matchedPerson.first_name} ${matchedPerson.last_name}` : null,
      status: (matchedPerson ? 'filled' : 'unfilled') as 'filled' | 'unfilled' | 'pending',
    }
  })

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    submitted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Proposals', href: '/proposals' },
          { label: outline.outline_name },
        ]}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {outline.outline_name}
          </h1>
          <span
            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[outline.status ?? 'draft'] ?? STATUS_COLORS.draft}`}
          >
            {(outline.status ?? 'draft').replace(/_/g, ' ')}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          {opportunityTitle && <span>{opportunityTitle}</span>}
          {outline.volume_type && (
            <span className="text-xs text-muted-foreground">
              {outline.volume_type}
            </span>
          )}
        </div>
      </div>

      {/* Volumes + Sections */}
      <ProposalDetailClient
        outlineId={id}
        opportunityId={outline.opportunity_id ?? ''}
        volumes={(volumes ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          volumeNumber: v.volume_number,
          pageLimit: v.page_limit,
          notes: v.notes,
          sections: sections
            .filter((s) => s.volume_id === v.id)
            .map((s) => ({
              id: s.id,
              sectionTitle: s.section_title,
              sectionNumber: s.section_number,
              pageAllocation: s.page_allocation,
              rfpReference: s.rfp_reference,
              assignedTo: s.assigned_to,
              status: s.status,
            })),
        }))}
        canEdit={canEdit}
        staffingRequirements={staffingRequirements}
      />
    </div>
  )
}
