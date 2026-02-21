'use client'

interface ComplianceHeatmapProps {
  data: { opportunity: string; score: number }[]
}

function getHeatColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500/80'
  if (score >= 70) return 'bg-emerald-500/40'
  if (score >= 50) return 'bg-amber-500/50'
  if (score >= 30) return 'bg-amber-500/80'
  return 'bg-red-500/60'
}

export function ComplianceHeatmap({ data }: ComplianceHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No compliance data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.opportunity} className="flex items-center gap-3">
          <span className="w-40 truncate text-xs text-muted-foreground">
            {item.opportunity}
          </span>
          <div className="flex-1 h-6 rounded bg-muted relative overflow-hidden">
            <div
              className={`h-full rounded ${getHeatColor(item.score)} transition-all`}
              style={{ width: `${item.score}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-mono text-foreground">
            {item.score}%
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div className="flex gap-0.5">
          {['bg-red-500/60', 'bg-amber-500/80', 'bg-amber-500/50', 'bg-emerald-500/40', 'bg-emerald-500/80'].map(
            (c, i) => (
              <div key={i} className={`h-3 w-6 rounded-sm ${c}`} />
            )
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  )
}
