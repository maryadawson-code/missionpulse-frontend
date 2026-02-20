// filepath: components/dashboard/KPICards.tsx
import type { DashboardKPIs } from '@/lib/types/opportunities'

interface KPICardProps {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  accentColor?: string
}

function KPICard({ label, value, subtext, icon, accentColor = 'text-cyan' }: KPICardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-cyan/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate">{label}</span>
        <span className={accentColor}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate mt-1">{subtext}</p>
    </div>
  )
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

// SVG icons inlined to avoid external dependencies
const PipelineIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const DollarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const GaugeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

interface KPICardsProps {
  kpis: DashboardKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Active Pipeline"
        value={String(kpis.pipelineCount)}
        subtext="active opportunities"
        icon={<PipelineIcon />}
      />
      <KPICard
        label="Total Ceiling"
        value={formatCurrency(kpis.totalCeiling)}
        subtext="combined contract value"
        icon={<DollarIcon />}
        accentColor="text-emerald-400"
      />
      <KPICard
        label="Avg Win Probability"
        value={`${kpis.avgPwin}%`}
        subtext="across active pipeline"
        icon={<GaugeIcon />}
        accentColor="text-amber-400"
      />
      <KPICard
        label="Upcoming Deadlines"
        value={String(kpis.upcomingDeadlines)}
        subtext="due within 30 days"
        icon={<CalendarIcon />}
        accentColor="text-red-400"
      />
    </div>
  )
}
