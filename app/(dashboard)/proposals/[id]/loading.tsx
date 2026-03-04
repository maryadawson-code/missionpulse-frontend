export default function ProposalDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading proposal details">
      <div>
        <div className="h-7 w-64 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-lg border border-border bg-navy/50" />
          <div className="h-32 rounded-lg border border-border bg-navy/50" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-lg border border-border bg-navy/50" />
          <div className="h-28 rounded-lg border border-border bg-navy/50" />
        </div>
      </div>
    </div>
  )
}
