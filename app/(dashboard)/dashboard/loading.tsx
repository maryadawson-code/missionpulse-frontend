export default function DashboardPageLoading() {
  return (
    <div className="space-y-8 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading dashboard">
      <div>
        <div className="h-7 w-56 rounded bg-slate-700" />
        <div className="h-4 w-40 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-6 h-64" />
        <div className="rounded-lg border border-border bg-surface p-6 h-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6 h-48" />
        <div className="rounded-lg border border-border bg-surface p-6 h-48" />
      </div>
    </div>
  )
}
