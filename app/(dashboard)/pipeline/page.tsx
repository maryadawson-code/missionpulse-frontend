// filepath: app/(dashboard)/pipeline/page.tsx

import { createClient } from '@/lib/supabase/server'
import { PipelineTable } from '@/components/modules/PipelineTable'
import type { Opportunity } from '@/lib/types'

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()

  // ─── Fetch Opportunities ────────────────────────────────────
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, title, agency, ceiling, pwin, phase, status, due_date, submission_date, set_aside, owner_id, priority, solicitation_number')
    .order('updated_at', { ascending: false })

  const opps = (opportunities ?? []) as Opportunity[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">
          {opps.length} opportunit{opps.length === 1 ? 'y' : 'ies'} in pipeline
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load pipeline: {error.message}
        </div>
      )}

      {/* Pipeline Table with client-side sort/filter/search/delete */}
      {!error && (
        <PipelineTable opportunities={opps} initialSearch={searchParams.q ?? ''} />
      )}
    </div>
  )
}
