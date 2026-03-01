export default function TimelineLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading timeline">
      <div className="h-7 w-36 rounded bg-muted" />
      <div className="rounded-lg border border-border bg-surface p-6 h-80" />
    </div>
  )
}
