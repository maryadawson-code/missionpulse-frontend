import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

const RfpUploader = dynamic(
  () => import('@/components/features/shredder/RfpUploader').then((m) => m.RfpUploader),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  }
)

const RfpDocumentList = dynamic(
  () => import('@/components/features/shredder/RfpDocumentList').then((m) => m.RfpDocumentList),
  {
    loading: () => (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    ),
  }
)

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
  if (!hasPermission(role, 'compliance', 'shouldRender')) return null

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

      <RfpUploader opportunityId={id} />

      <RfpDocumentList
        documents={documents ?? []}
        opportunityId={id}
      />
    </div>
  )
}
