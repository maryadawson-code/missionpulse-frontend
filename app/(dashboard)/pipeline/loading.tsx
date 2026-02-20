// filepath: app/(dashboard)/pipeline/loading.tsx
export default function PipelineLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-700 mt-2" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded bg-slate-700" />
        <div className="h-9 w-32 rounded bg-slate-700" />
        <div className="h-9 w-32 rounded bg-slate-700" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-surface" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-t border-border bg-navy/50"
          />
        ))}
      </div>
    </div>
  )
}
