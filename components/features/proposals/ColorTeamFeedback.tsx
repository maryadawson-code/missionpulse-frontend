'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'

interface Finding {
  id: string
  description: string
  severity: string | null
  finding_type: string | null
  reviewer_name: string | null
  status: string | null
  recommendation: string | null
  page_number: number | null
  created_at: string | null
}

interface Review {
  id: string
  review_name: string
  review_type: string
  status: string | null
  overall_rating: string | null
  lead_reviewer_name: string | null
  scheduled_date: string | null
  findings: Finding[]
}

interface ColorTeamFeedbackProps {
  reviews: Review[]
}

function reviewTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'pink':
    case 'pink_team':
      return 'bg-pink-500/15 text-pink-300 border-pink-500/30'
    case 'green':
    case 'green_team':
      return 'bg-green-500/15 text-green-300 border-green-500/30'
    case 'red':
    case 'red_team':
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    case 'gold':
    case 'gold_team':
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
    default:
      return 'bg-gray-500/15 text-gray-300 border-gray-500/30'
  }
}

function severityIcon(severity: string | null) {
  switch (severity) {
    case 'critical':
    case 'major':
      return <AlertTriangle className="h-3 w-3 text-red-400" />
    case 'minor':
      return <AlertTriangle className="h-3 w-3 text-amber-400" />
    default:
      return <MessageSquare className="h-3 w-3 text-muted-foreground" />
  }
}

function severityBadge(severity: string | null): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-300'
    case 'major':
      return 'bg-orange-500/15 text-orange-300'
    case 'minor':
      return 'bg-amber-500/15 text-amber-300'
    default:
      return 'bg-gray-500/15 text-gray-300'
  }
}

export function ColorTeamFeedback({ reviews }: ColorTeamFeedbackProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(reviews.map((r) => [r.id, true]))
  )

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No color team reviews scheduled yet. Reviews will appear as sections move through the review pipeline.
        </p>
      </div>
    )
  }

  const totalFindings = reviews.reduce((sum, r) => sum + r.findings.length, 0)
  const openFindings = reviews.reduce(
    (sum, r) => sum + r.findings.filter((f) => f.status !== 'resolved').length,
    0
  )

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        <span>{totalFindings} finding{totalFindings !== 1 ? 's' : ''}</span>
        {openFindings > 0 && (
          <span className="text-amber-400">{openFindings} open</span>
        )}
      </div>

      {/* Reviews */}
      {reviews.map((review) => {
        const isExpanded = expanded[review.id] ?? false
        const openCount = review.findings.filter((f) => f.status !== 'resolved').length

        return (
          <div key={review.id} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${reviewTypeColor(review.review_type)}`}>
                  {review.review_type.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-foreground">{review.review_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {review.lead_reviewer_name && (
                  <span className="text-[10px] text-muted-foreground">{review.lead_reviewer_name}</span>
                )}
                {openCount > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                    {openCount} open
                  </span>
                )}
                {review.overall_rating && (
                  <span className="text-[10px] text-muted-foreground">Rating: {review.overall_rating}</span>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {review.findings.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">No findings recorded.</p>
                ) : (
                  review.findings.map((finding) => (
                    <div key={finding.id} className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        {severityIcon(finding.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-foreground">{finding.description}</p>
                            {finding.severity && (
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${severityBadge(finding.severity)}`}>
                                {finding.severity}
                              </span>
                            )}
                            {finding.status === 'resolved' && (
                              <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                            )}
                          </div>
                          {finding.recommendation && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Recommendation: {finding.recommendation}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {finding.reviewer_name && <span>{finding.reviewer_name}</span>}
                            {finding.page_number && <span>p. {finding.page_number}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
