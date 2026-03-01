export default function ShredderLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading RFP shredder">
      <div>
        <div className="h-7 w-44 rounded bg-slate-700" />
        <div className="h-4 w-60 rounded bg-slate-700 mt-2" />
      </div>
      <div className="rounded-lg border border-border border-dashed bg-navy/50 p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded bg-slate-700" />
          <div className="h-4 w-48 rounded bg-slate-700" />
          <div className="h-3 w-32 rounded bg-slate-700" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
