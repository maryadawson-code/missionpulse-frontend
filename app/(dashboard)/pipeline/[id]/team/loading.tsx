export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-44 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-navy/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-700" />
              <div className="space-y-1">
                <div className="h-4 w-28 rounded bg-slate-700" />
                <div className="h-3 w-20 rounded bg-slate-700" />
              </div>
            </div>
            <div className="h-6 w-24 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  )
}
