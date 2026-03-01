export default function ComplianceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-52 rounded bg-slate-700" />
        <div className="h-4 w-72 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
      <div className="rounded-lg border border-border bg-navy/50">
        <div className="h-10 border-b border-border" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-3">
            <div className="h-4 w-24 rounded bg-slate-700" />
            <div className="h-4 flex-1 rounded bg-slate-700" />
            <div className="h-6 w-20 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  )
}
