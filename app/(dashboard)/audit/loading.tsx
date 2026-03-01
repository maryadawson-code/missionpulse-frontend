export default function AuditLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading audit log">
      <div>
        <div className="h-7 w-32 rounded bg-slate-700" />
        <div className="h-4 w-48 rounded bg-slate-700 mt-2" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded bg-slate-700" />
        <div className="h-9 w-32 rounded bg-slate-700" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-surface" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 border-t border-border bg-navy/50"
          />
        ))}
      </div>
    </div>
  )
}
