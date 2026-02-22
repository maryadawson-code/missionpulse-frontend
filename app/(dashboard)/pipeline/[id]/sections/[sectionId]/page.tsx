import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { SectionEditorClient } from './SectionEditorClient'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface SectionEditorPageProps {
  params: Promise<{ id: string; sectionId: string }>
}

export default async function SectionEditorPage({ params }: SectionEditorPageProps) {
  const { id, sectionId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch user profile for lock/comment identity
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'shouldRender')) return null

  // Fetch section
  const { data: section, error: sectionError } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, content, writer_id, reviewer_id')
    .eq('id', sectionId)
    .single()

  if (sectionError || !section) notFound()

  // Fetch opportunity metadata
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!opportunity) notFound()

  // Fetch compliance requirements linked to this opportunity (for AI Writer context)
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('requirement')
    .eq('opportunity_id', id)

  // Fetch RFP context
  const { data: rfpDocs } = await supabase
    .from('rfp_documents')
    .select('extracted_text')
    .eq('opportunity_id', id)
    .limit(1)

  const requirementTexts = (requirements ?? [])
    .map((r) => r.requirement)
    .filter((t): t is string => !!t)

  const rfpContext = rfpDocs?.[0]?.extracted_text ?? ''

  const userName = profile?.full_name ?? profile?.email ?? 'Unknown'

  // Status badge color (6-state color team workflow)
  function statusColor(status: string | null): string {
    switch (status) {
      case 'final':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'pink_review':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
      case 'green_review':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'red_review':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'revision':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    pink_review: 'Pink Team',
    revision: 'Revision',
    green_review: 'Green Team',
    red_review: 'Red Team',
    final: 'Final',
  }

  function volumeColor(volume: string | null): string {
    switch (volume) {
      case 'Technical':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'Management':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'Past Performance':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'Cost':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-gray-500/15 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Pipeline', href: '/pipeline' },
        { label: opportunity.title, href: `/pipeline/${id}` },
        { label: 'Swimlane', href: `/pipeline/${id}/swimlane` },
        { label: section.section_title },
      ]} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{section.section_title}</h1>
        <div className="mt-1 flex items-center gap-2">
          {section.volume && (
            <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${volumeColor(section.volume)}`}>
              {section.volume}
            </span>
          )}
          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(section.status)}`}>
            {STATUS_LABELS[section.status ?? 'draft'] ?? section.status ?? 'Draft'}
          </span>
          <span className="text-xs text-gray-500">{opportunity.title}</span>
        </div>
      </div>

      {/* Editor Layout */}
      <SectionEditorClient
        opportunityId={id}
        sectionId={sectionId}
        sectionTitle={section.section_title}
        initialContent={section.content ?? ''}
        requirements={requirementTexts}
        rfpContext={rfpContext}
        userId={user.id}
        userName={userName}
      />
    </div>
  )
}
