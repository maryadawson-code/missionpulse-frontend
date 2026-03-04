export default function SectionEditorLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading section editor">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded bg-muted" />
          <div className="h-9 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-6 h-96" />
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 h-48" />
          <div className="rounded-lg border border-border bg-surface p-4 h-32" />
        </div>
      </div>
    </div>
  )
}
