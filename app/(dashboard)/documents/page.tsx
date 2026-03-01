import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { GlobalDocumentLibrary } from '@/components/features/documents/GlobalDocumentLibrary'

export const metadata: Metadata = {
  title: 'Documents — MissionPulse',
}
import { TemplateLibrary } from '@/components/features/documents/TemplateLibrary'

interface DocumentVersionInfo {
  id: string
  version_number: number
  version_label: string | null
  changes_summary: string | null
  created_by: string | null
  created_at: string | null
  file_url: string | null
  file_size: number | null
  is_milestone: boolean | null
}

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
    return null
  }
  const canEdit = hasPermission(role, 'documents', 'canEdit')

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

  // Fetch document templates
  const { data: templateRows } = await supabase
    .from('document_templates')
    .select('id, template_name, template_type, category, description, file_url, version, tags, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(100)

  const templates = (templateRows ?? []).map((t) => ({
    ...t,
    tags: Array.isArray(t.tags) ? t.tags as string[] : null,
  }))

  // Fetch version history for all documents
  const docIds = (documents ?? []).map((d) => d.id)
  const versionsMap: Record<string, DocumentVersionInfo[]> = {}
  if (docIds.length > 0) {
    const { data: versions } = await supabase
      .from('document_versions')
      .select(
        'id, document_id, version_number, version_label, changes_summary, created_by, created_at, file_url, file_size, is_milestone'
      )
      .in('document_id', docIds)
      .order('version_number', { ascending: false })
      .limit(500)

    for (const v of versions ?? []) {
      if (!v.document_id) continue
      if (!versionsMap[v.document_id]) versionsMap[v.document_id] = []
      versionsMap[v.document_id].push(v)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company-wide document library. Templates, past performance, capabilities, and certifications.
        </p>
      </div>

      <GlobalDocumentLibrary
        documents={documents ?? []}
        opportunityMap={oppMap}
        canEdit={canEdit}
        versionsMap={versionsMap}
      />

      {/* Template Library */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Template Library</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Reusable document templates for proposal volumes, past performance, and capability statements.
        </p>
        <TemplateLibrary templates={templates} />
      </div>
    </div>
  )
}
