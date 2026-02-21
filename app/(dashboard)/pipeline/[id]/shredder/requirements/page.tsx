import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RequirementsExtractor } from '@/components/features/shredder/RequirementsExtractor'

interface RequirementsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ doc?: string }>
}

export default async function RequirementsPage({
  params,
  searchParams,
}: RequirementsPageProps) {
  const { id } = await params
  const { doc: docId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Verify opportunity exists
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  // If no doc specified, redirect to shredder main page
  if (!docId) {
    redirect(`/pipeline/${id}/shredder`)
  }

  // Fetch the RFP document
  const { data: document, error: docError } = await supabase
    .from('rfp_documents')
    .select('id, file_name, extracted_text, upload_status')
    .eq('id', docId)
    .eq('opportunity_id', id)
    .single()

  if (docError || !document) notFound()

  if (document.upload_status !== 'processed' || !document.extracted_text) {
    redirect(`/pipeline/${id}/shredder`)
  }

  // Fetch existing requirements for this opportunity
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('id, reference, requirement, section, priority, status, assigned_to, page_reference, volume_reference, notes')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true })

  // Fetch team members for assignment
  const { data: teamMembers } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name, assignee_email')
    .eq('opportunity_id', id)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Extract Requirements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {document.file_name}
        </p>
      </div>

      <RequirementsExtractor
        opportunityId={id}
        documentId={document.id}
        sourceText={document.extracted_text}
        existingRequirements={requirements ?? []}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
