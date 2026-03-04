export default function NewOpportunityLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading form">
      <div className="h-7 w-48 rounded bg-muted" />
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-9 w-full rounded bg-muted/50" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-9 w-20 rounded bg-muted" />
          <div className="h-9 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
