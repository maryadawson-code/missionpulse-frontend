// filepath: components/rbac/CUIBanner.tsx
interface CUIBannerProps {
  marking: 'SP-PROPIN' | 'OPSEC' | 'SP-PRVCY'
  className?: string
}

const MARKING_LABELS: Record<CUIBannerProps['marking'], string> = {
  'SP-PROPIN': 'CUI // SP-PROPIN — Proprietary Business Information',
  OPSEC: 'CUI // OPSEC — Operations Security',
  'SP-PRVCY': 'CUI // SP-PRVCY — Privacy Information',
}

export function CUIBanner({ marking, className = '' }: CUIBannerProps) {
  return (
    <div
      className={`rounded-md border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-xs font-mono text-amber-700 dark:text-amber-300 ${className}`}
      role="alert"
      aria-label="CUI marking"
    >
      ⚠ {MARKING_LABELS[marking]}
    </div>
  )
}
