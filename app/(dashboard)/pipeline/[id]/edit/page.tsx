// filepath: app/(dashboard)/pipeline/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getOpportunity } from '@/lib/actions/opportunities'
import { OpportunityForm } from '@/components/modules/OpportunityForm'

interface EditOpportunityPageProps {
  params: Promise<{ id: string }>
}

export default async function EditOpportunityPage({
  params,
}: EditOpportunityPageProps) {
  const { id } = await params
  const { data: opportunity, error } = await getOpportunity(id)

  if (error || !opportunity) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Opportunity</h1>
        <p className="text-sm text-slate mt-1">{opportunity.title}</p>
      </div>
      <OpportunityForm mode="edit" opportunity={opportunity} />
    </div>
  )
}
