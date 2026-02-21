'use client'

import { AlertTriangle, Zap } from 'lucide-react'

interface SoloModeBannerProps {
  companyName?: string
}

export function SoloModeBanner({ companyName }: SoloModeBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#00E5FA]/20 bg-[#00E5FA]/5 px-3 py-1.5">
      <Zap className="h-3.5 w-3.5 text-[#00E5FA]" />
      <span className="text-xs font-medium text-[#00E5FA]">
        Solo Mode
      </span>
      {companyName && (
        <span className="text-xs text-muted-foreground">
          — {companyName}
        </span>
      )}
    </div>
  )
}

interface AIConfidenceWarningProps {
  confidence: number
  riskFactors?: string[]
}

export function AIConfidenceWarning({
  confidence,
  riskFactors = [],
}: AIConfidenceWarningProps) {
  if (confidence >= 70) return null

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-300">
          Low AI Confidence: {confidence}%
        </span>
      </div>
      <p className="text-xs text-amber-300/80">
        AI confidence is below 70%. Review these suggestions carefully before
        accepting. In Solo Mode, there is no second reviewer — you are the
        final authority.
      </p>
      {riskFactors.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {riskFactors.map((rf, i) => (
            <li key={i} className="text-xs text-amber-300/70">
              • {rf}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
