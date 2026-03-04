import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface UpgradeNudgeProps {
  feature: string
  targetPlan?: string
  className?: string
}

export function UpgradeNudge({
  feature,
  targetPlan = 'Professional',
  className = '',
}: UpgradeNudgeProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 ${className}`}
    >
      <div className="flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{feature}</span> is available on the{' '}
          <span className="font-semibold text-primary">{targetPlan}</span> plan.
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Upgrade
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
