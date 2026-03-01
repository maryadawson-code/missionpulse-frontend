'use client'

import { AlertTriangle, CheckCircle2, FileQuestion, FileX, Link2Off } from 'lucide-react'
import type { GapReport as GapReportType, ComplianceGap } from '@/lib/ai/proactive/section-detector'

// ─── Types ───────────────────────────────────────────────────

interface GapReportProps {
  report: GapReportType
}

// ─── Component ───────────────────────────────────────────────

export function GapReport({ report }: GapReportProps) {
  const { summary, gaps } = report

  const scoreColor =
    summary.overallComplianceScore >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : summary.overallComplianceScore >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Compliance Gap Report</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {summary.overallComplianceScore}%
          </span>
          <span className="text-xs text-muted-foreground">compliance</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{report.totalRequirements}</p>
          <p className="text-xs text-muted-foreground">Requirements</p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3 text-center">
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">{summary.unassignedRequirements}</p>
          <p className="text-xs text-muted-foreground">Unassigned</p>
        </div>
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10 p-3 text-center">
          <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{summary.emptySections}</p>
          <p className="text-xs text-muted-foreground">Empty Sections</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <p className="text-lg font-semibold text-muted-foreground">{summary.orphanSections}</p>
          <p className="text-xs text-muted-foreground">Orphan Sections</p>
        </div>
      </div>

      {/* Gap list */}
      {gaps.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">All requirements mapped. No gaps detected.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gaps.map((gap) => (
            <GapItem key={gap.id} gap={gap} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Gap Item ────────────────────────────────────────────────

function GapItem({ gap }: { gap: ComplianceGap }) {
  const icon =
    gap.type === 'unassigned_requirement' ? (
      <FileQuestion className="h-4 w-4 text-red-600 dark:text-red-400" />
    ) : gap.type === 'empty_section' ? (
      <FileX className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    ) : (
      <Link2Off className="h-4 w-4 text-muted-foreground" />
    )

  const severityBadge = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
    low: 'bg-gray-500/10 text-muted-foreground border-border',
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{gap.title}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${severityBadge[gap.severity]}`}
            >
              {gap.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{gap.description}</p>
          <div className="mt-2 flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400/60" />
            <p className="text-xs text-cyan-600 dark:text-cyan-400/80">{gap.suggestedFix}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
