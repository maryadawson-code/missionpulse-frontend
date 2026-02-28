export default function WorkflowLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-700 mt-2" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-surface" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
