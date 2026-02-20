/**
 * Pipeline Page — Server Component
 * Fetches opportunities + stats, passes to client board
 * © 2026 Mission Meets Tech
 */
import { getOpportunitiesByPhase, getPipelineStats } from '@/lib/actions/opportunities'
import PipelineBoard from '@/components/modules/PipelineBoard'

export default async function PipelinePage() {
  const [opportunitiesByPhase, statsResult] = await Promise.all([
    getOpportunitiesByPhase(),
    getPipelineStats(),
  ])

  const stats = statsResult

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Pipeline Value" value={formatCurrency(stats.totalValue)} />
          <StatCard label="Weighted Value" value={formatCurrency(Math.round(stats.totalValue * (stats.avgPwin / 100)))} />
          <StatCard label="Opportunities" value={String(stats.total)} />
          <StatCard label="Active Pursuits" value={String(stats.byStatus['Active'] ?? 0)} />
          <StatCard label="Avg Win Prob" value={`${stats.avgPwin}%`} />
        </div>
      )}

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

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}
