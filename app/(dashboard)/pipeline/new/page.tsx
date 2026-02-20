// filepath: app/(dashboard)/pipeline/new/page.tsx
import { OpportunityForm } from '@/components/modules/OpportunityForm'

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Opportunity</h1>
        <p className="text-sm text-slate mt-1">
          Add a new capture opportunity to the pipeline
        </p>
      </div>
      <OpportunityForm mode="create" />
    </div>
  )
}
