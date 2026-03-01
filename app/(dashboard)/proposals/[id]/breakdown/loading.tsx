export default function BreakdownLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading breakdown">
      <div className="h-7 w-36 rounded bg-slate-700" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6 h-40" />
        ))}
      </div>
    </div>
  )
}
