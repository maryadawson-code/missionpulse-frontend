import Link from 'next/link'
import { Settings } from 'lucide-react'

interface IntegrationPlaceholderProps {
  service: string
  feature: string
  className?: string
}

export function IntegrationPlaceholder({
  service,
  feature,
  className = '',
}: IntegrationPlaceholderProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-5 ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Settings className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Connect {service}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Set up {service} to unlock {feature}.
        </p>
      </div>
      <Link
        href="/settings"
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        Set Up
      </Link>
    </div>
  )
}
