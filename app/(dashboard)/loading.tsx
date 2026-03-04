// filepath: app/(dashboard)/loading.tsx
import { KPIGridSkeleton } from '@/components/dashboard/KPICardSkeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse motion-reduce:animate-none" role="status" aria-busy="true" aria-label="Loading dashboard">
      <div>
        <div className="h-7 w-56 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted mt-2" />
      </div>
      <KPIGridSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-6 h-48" />
        <div className="rounded-lg border border-border bg-surface p-6 h-48" />
      </div>
    </div>
  )
}
