export default function ProposalsLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading proposals">
      <div>
        <div className="h-7 w-40 rounded bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-700 mt-2" />
      </div>
      <div className="rounded-lg border border-border bg-navy/50 p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-slate-700/50" />
          ))}
        </div>
      </div>
    </div>
  )
}
