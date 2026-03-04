export default function CollaborationLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading collaboration">
      <div>
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted mt-2" />
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-8 rounded-full bg-muted" />
        ))}
        <div className="h-4 w-32 rounded bg-muted ml-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-lg border border-border bg-navy/50" />
        <div className="h-64 rounded-lg border border-border bg-navy/50" />
      </div>
    </div>
  )
}
