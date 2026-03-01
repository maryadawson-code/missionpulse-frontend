export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading settings">
      <div>
        <div className="h-7 w-32 rounded bg-slate-700" />
        <div className="h-4 w-48 rounded bg-slate-700 mt-2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-navy/50" />
        ))}
      </div>
    </div>
  )
}
