export default function SectionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-700 mt-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border bg-navy/50 p-4"
          >
            <div className="h-5 w-5 rounded bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-700" />
              <div className="h-3 w-24 rounded bg-slate-700" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  )
}
