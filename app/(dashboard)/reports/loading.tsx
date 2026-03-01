export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading reports">
      <div className="h-7 w-32 rounded bg-slate-700" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 h-20" />
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 h-72" />
    </div>
  )
}
