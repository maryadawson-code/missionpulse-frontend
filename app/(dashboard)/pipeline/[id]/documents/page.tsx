import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { DocumentLibrary } from '@/components/features/documents/DocumentLibrary'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface DocumentsPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
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
  if (!hasPermission(role, 'documents', 'shouldRender')) return null

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  const { data: documents } = await supabase
    .from('documents')
    .select(
      'id, document_name, document_type, description, file_url, file_size, mime_type, status, current_version, is_locked, locked_by, tags, uploaded_by, created_at, updated_at'
    )
    .eq('opportunity_id', id)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Documents' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {(documents ?? []).length} document{(documents ?? []).length !== 1 ? 's' : ''}
        </p>
      </div>

      <DocumentLibrary
        documents={documents ?? []}
        opportunityId={id}
      />
    </div>
  )
}
