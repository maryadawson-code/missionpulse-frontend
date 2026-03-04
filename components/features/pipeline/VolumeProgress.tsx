interface Section {
  volume: string | null
  status: string | null
}

interface VolumeProgressProps {
  sections: Section[]
}

export function VolumeProgress({ sections }: VolumeProgressProps) {
  if (sections.length === 0) return null

  // Group sections by volume
  const volumes: Record<string, { total: number; final: number }> = {}
  for (const s of sections) {
    const vol = s.volume ?? 'Unassigned'
    if (!volumes[vol]) volumes[vol] = { total: 0, final: 0 }
    volumes[vol].total++
    if (s.status === 'final') volumes[vol].final++
  }

  const sorted = Object.entries(volumes).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Volume Progress
      </h2>
      <div className="space-y-3">
        {sorted.map(([volume, { total, final }]) => {
          const pct = total > 0 ? Math.round((final / total) * 100) : 0
          const barColor =
            pct >= 100
              ? 'bg-emerald-500'
              : pct >= 50
                ? 'bg-amber-500'
                : 'bg-primary'
          return (
            <div key={volume}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{volume}</span>
                <span className="text-xs text-muted-foreground">
                  {final}/{total} sections final
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
