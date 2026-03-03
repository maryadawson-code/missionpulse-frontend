import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { ShredderPageClient } from './ShredderPageClient'

interface ShredderPageProps {
  params: Promise<{ id: string }>
}

export default async function ShredderPage({ params }: ShredderPageProps) {
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
  if (!hasPermission(role, 'pipeline', 'shouldRender')) return null

  // Verify opportunity exists (RLS-enforced)
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  // Fetch existing RFP documents
  const { data: documents } = await supabase
    .from('rfp_documents')
    .select('id, file_name, file_type, file_size, upload_status, created_at, extracted_text')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false })

  // Compute text_length on the server so client filter doesn't depend on
  // full extracted_text serialization (which can be megabytes)
  const docsWithLength = (documents ?? []).map((doc) => ({
    ...doc,
    text_length: doc.extracted_text?.length ?? 0,
  }))

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'RFP Shredder' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">RFP Shredder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — Upload and parse RFP documents to extract requirements
        </p>
      </div>

      <ShredderPageClient
        opportunityId={id}
        documents={docsWithLength}
      />
    </div>
  )
}
