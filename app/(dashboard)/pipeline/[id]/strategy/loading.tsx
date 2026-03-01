export default function StrategyLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading strategy">
      <div className="h-7 w-36 rounded bg-slate-700" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6 space-y-3">
            <div className="h-5 w-32 rounded bg-slate-700" />
            <div className="h-4 w-full rounded bg-slate-700/50" />
            <div className="h-4 w-3/4 rounded bg-slate-700/50" />
            <div className="h-4 w-1/2 rounded bg-slate-700/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
