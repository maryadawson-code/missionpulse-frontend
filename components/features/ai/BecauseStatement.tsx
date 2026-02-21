'use client'

import { Info } from 'lucide-react'

interface BecauseStatementProps {
  reason: string
}

export function BecauseStatement({ reason }: BecauseStatementProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2">
      <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
        Because: {reason}
      </p>
    </div>
  )
}
