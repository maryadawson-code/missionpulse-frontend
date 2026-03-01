export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading billing">
      <div className="h-7 w-32 rounded bg-slate-700" />
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-slate-700" />
        <div className="h-12 w-full rounded bg-slate-700/50" />
        <div className="h-4 w-64 rounded bg-slate-700/50" />
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 h-48" />
    </div>
  )
}
