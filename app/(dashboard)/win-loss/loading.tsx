export default function WinLossLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading win/loss analysis">
      <div className="h-7 w-44 rounded bg-slate-700" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 h-24" />
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 h-72" />
    </div>
  )
}
