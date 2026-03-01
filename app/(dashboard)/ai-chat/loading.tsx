export default function AIChatLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading AI chat">
      <div>
        <div className="h-7 w-32 rounded bg-slate-700" />
        <div className="h-4 w-48 rounded bg-slate-700 mt-2" />
      </div>
      <div className="h-96 rounded-lg border border-border bg-navy/50" />
    </div>
  )
}
