export default function SwimlaneLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading swimlane board">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-slate-700" />
        <div className="h-9 w-32 rounded bg-slate-700" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="h-5 w-24 rounded bg-slate-700" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-md border border-border bg-navy/50 p-3 h-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
