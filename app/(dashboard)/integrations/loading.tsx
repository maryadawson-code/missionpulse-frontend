export default function IntegrationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-44 rounded bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
