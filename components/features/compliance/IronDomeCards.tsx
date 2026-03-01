import { Shield, AlertTriangle, CheckCircle2, Activity, Target, Building2 } from 'lucide-react'

interface IronDomeCardsProps {
  totalReqs: number
  totalAddressed: number
  totalVerified: number
  overallPct: number
  gapCount: number
  activeOpps: number
}

export function IronDomeCards({
  totalReqs,
  totalAddressed,
  totalVerified,
  overallPct,
  gapCount,
  activeOpps,
}: IronDomeCardsProps) {
  const cards = [
    {
      label: 'Overall Health',
      value: `${overallPct}%`,
      icon: Shield,
      color:
        overallPct >= 80
          ? 'text-emerald-600 dark:text-emerald-400'
          : overallPct >= 50
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Total Requirements',
      value: totalReqs.toLocaleString(),
      icon: Target,
      color: 'text-primary',
    },
    {
      label: 'Addressed',
      value: totalAddressed.toLocaleString(),
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Verified',
      value: totalVerified.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Gaps',
      value: gapCount.toLocaleString(),
      icon: AlertTriangle,
      color: gapCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
    },
    {
      label: 'Active Pursuits',
      value: activeOpps.toLocaleString(),
      icon: Building2,
      color: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
          </div>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
