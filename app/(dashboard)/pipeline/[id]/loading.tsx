export default function PipelineDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded bg-slate-700" />
        <div className="h-4 w-72 rounded bg-slate-700 mt-2" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-slate-700" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-lg border border-border bg-navy/50" />
          <div className="h-32 rounded-lg border border-border bg-navy/50" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-lg border border-border bg-navy/50" />
          <div className="h-40 rounded-lg border border-border bg-navy/50" />
        </div>
      </div>
    </div>
  )
}
