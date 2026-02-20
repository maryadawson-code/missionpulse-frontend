// filepath: components/dashboard/KPICardSkeleton.tsx
export function KPICardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-700 mb-3" />
      <div className="h-8 w-32 rounded bg-slate-700 mb-2" />
      <div className="h-3 w-20 rounded bg-slate-700" />
    </div>
  )
}

export function KPIGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  )
}
