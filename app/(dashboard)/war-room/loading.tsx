export default function WarRoomLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading war room">
      <div>
        <div className="h-7 w-40 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-700 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
