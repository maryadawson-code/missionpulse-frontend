// filepath: app/(dashboard)/pipeline/page.tsx
import { getOpportunities } from '@/lib/actions/opportunities'
import { PipelineTable } from '@/components/modules/PipelineTable'

export default async function PipelinePage() {
  const { data: opportunities, error } = await getOpportunities()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-sm text-slate mt-1">
          Track and manage proposal opportunities through Shipley gates
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6">
          <p className="text-red-400 text-sm">
            Failed to load pipeline. {error}
          </p>
        </div>
      ) : (
        <PipelineTable opportunities={opportunities ?? []} />
      )}
    </div>
  )
}
