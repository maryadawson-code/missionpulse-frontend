import { cn } from '@/lib/utils'
import { SHIPLEY_PHASES } from '@/lib/types/opportunities'

interface PhaseIndicatorProps {
  phase: string | null
  className?: string
}

export function PhaseIndicator({ phase, className }: PhaseIndicatorProps) {
  const currentPhase = phase ?? 'Gate 1'
  const currentIndex = SHIPLEY_PHASES.indexOf(currentPhase as typeof SHIPLEY_PHASES[number])
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0
  const progress = ((resolvedIndex + 1) / SHIPLEY_PHASES.length) * 100

  function phaseColor(index: number): string {
    if (index < resolvedIndex) return 'bg-primary'
    if (index === resolvedIndex) return 'bg-primary'
    return 'bg-muted'
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {currentPhase}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="flex gap-1">
        {SHIPLEY_PHASES.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              phaseColor(i)
            )}
          />
        ))}
      </div>
    </div>
  )
}
