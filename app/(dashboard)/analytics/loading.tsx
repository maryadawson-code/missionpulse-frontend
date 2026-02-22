export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
