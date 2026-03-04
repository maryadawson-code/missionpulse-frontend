// filepath: app/(dashboard)/pipeline/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getOpportunity } from '@/lib/actions/opportunities'
import { OpportunityForm } from '@/components/modules/OpportunityForm'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface EditOpportunityPageProps {
  params: Promise<{ id: string }>
}

export default async function EditOpportunityPage({
  params,
}: EditOpportunityPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'pipeline', 'canEdit')) return null

  const { data: opportunity, error } = await getOpportunity(id)

  if (error || !opportunity) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Edit' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Opportunity</h1>
        <p className="text-sm text-slate mt-1">{opportunity.title}</p>
      </div>
      <OpportunityForm mode="edit" opportunity={opportunity} />
    </div>
  )
}
