import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SectionEditorClient } from './SectionEditorClient'

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
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

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

  // Status badge color
  function statusColor(status: string | null): string {
    switch (status) {
      case 'Final':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'Review':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Revision':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/pipeline/${id}/swimlane`}
            className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="Back to swimlane"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{section.section_title}</h1>
            <div className="mt-1 flex items-center gap-2">
              {section.volume && (
                <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${volumeColor(section.volume)}`}>
                  {section.volume}
                </span>
              )}
              <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(section.status)}`}>
                {section.status ?? 'Draft'}
              </span>
              <span className="text-xs text-gray-500">{opportunity.title}</span>
            </div>
          </div>
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
