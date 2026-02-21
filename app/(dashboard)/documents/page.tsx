import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { GlobalDocumentLibrary } from '@/components/features/documents/GlobalDocumentLibrary'

export default async function DocumentsPage() {
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
  if (!hasPermission(role, 'documents', 'shouldRender')) {
    redirect('/')
  }

  // Fetch all company-level documents + opportunity documents
  const { data: documents } = await supabase
    .from('documents')
    .select(
      'id, document_name, document_type, description, file_url, file_size, mime_type, status, current_version, is_locked, folder_path, tags, opportunity_id, uploaded_by, created_at, updated_at'
    )
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(200)

  // Fetch opportunity titles for documents linked to opportunities
  const oppIds = Array.from(
    new Set(
      (documents ?? [])
        .map((d) => d.opportunity_id)
        .filter((id): id is string => !!id)
    )
  )

  let oppMap: Record<string, string> = {}
  if (oppIds.length > 0) {
    const { data: opps } = await supabase
      .from('opportunities')
      .select('id, title')
      .in('id', oppIds)

    oppMap = Object.fromEntries((opps ?? []).map((o) => [o.id, o.title]))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company-wide document library. Templates, past performance, capabilities, and certifications.
        </p>
      </div>

      <GlobalDocumentLibrary
        documents={documents ?? []}
        opportunityMap={oppMap}
      />
    </div>
  )
}
