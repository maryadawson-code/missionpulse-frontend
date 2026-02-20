/**
 * Pipeline Page — Server Component
 * Fetches opportunities + stats, passes to client board
 * © 2026 Mission Meets Tech
 */
import { getOpportunitiesByPhase, getPipelineStats } from '@/lib/actions/opportunities'
import PipelineBoard from '@/components/modules/PipelineBoard'

export default async function PipelinePage() {
  const [opportunitiesByPhase, stats] = await Promise.all([
    getOpportunitiesByPhase(),
    getPipelineStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Pipeline Value" value={formatCurrency(stats.totalCeiling)} />
        <StatCard label="Weighted Value" value={formatCurrency(stats.weightedValue)} />
        <StatCard label="Opportunities" value={String(stats.totalOpportunities)} />
        <StatCard label="Active Pursuits" value={String(stats.activeOpportunities)} />
        <StatCard label="Avg Win Prob" value={`${stats.avgPwin}%`} />
      </div>

      {/* Kanban Board */}
      <PipelineBoard initialData={opportunitiesByPhase} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#000A1A] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function formatCurrency(cents: number): string {
  if (cents >= 1_000_000_000) return `$${(cents / 1_000_000_000).toFixed(1)}B`
  if (cents >= 1_000_000) return `$${(cents / 1_000_000).toFixed(0)}M`
  if (cents >= 1_000) return `$${(cents / 1_000).toFixed(0)}K`
  return `$${cents}`
}
