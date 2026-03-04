'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'
import {
  updateClauseCompliance,
  updateClauseNotes,
  updateClauseRisk,
} from '@/app/(dashboard)/pipeline/[id]/contracts/actions'

const COMPLIANCE_STATUSES = ['Compliant', 'Review Needed', 'Non-Compliant'] as const
const RISK_LEVELS = ['Low', 'Medium', 'High'] as const

interface Clause {
  id: string
  clause_number: string
  clause_title: string | null
  clause_type: string | null
  full_text: string | null
  risk_level: string | null
  compliance_status: string | null
  notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface ContractScannerProps {
  clauses: Clause[]
  opportunityId: string
}

function riskColor(level: string | null): string {
  switch (level) {
    case 'High':
      return 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
    case 'Medium':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'Low':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function complianceColor(status: string | null): string {
  switch (status) {
    case 'Compliant':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    case 'Review Needed':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'Non-Compliant':
      return 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function ContractScanner({ clauses, opportunityId }: ContractScannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterRisk, setFilterRisk] = useState<string>('All')
  const [filterCompliance, setFilterCompliance] = useState<string>('All')

  const filtered = clauses.filter((c) => {
    if (filterRisk !== 'All' && c.risk_level !== filterRisk) return false
    if (filterCompliance !== 'All' && c.compliance_status !== filterCompliance) return false
    return true
  })

  if (clauses.length === 0) {
    return (
      <div className="rounded-lg border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No contract clauses found for this opportunity. Clauses will appear after contract analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Risks</SelectItem>
            {RISK_LEVELS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCompliance} onValueChange={setFilterCompliance}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Compliance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {COMPLIANCE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {clauses.length} clauses
        </span>
      </div>

      {/* Clause List */}
      <div className="space-y-2">
        {filtered.map((clause) => (
          <ClauseRow
            key={clause.id}
            clause={clause}
            opportunityId={opportunityId}
            isExpanded={expandedId === clause.id}
            onToggle={() =>
              setExpandedId(expandedId === clause.id ? null : clause.id)
            }
          />
        ))}
      </div>
    </div>
  )
}

function ClauseRow({
  clause,
  opportunityId,
  isExpanded,
  onToggle,
}: {
  clause: Clause
  opportunityId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(clause.notes ?? '')

  const handleComplianceChange = (status: string) => {
    startTransition(async () => {
      const result = await updateClauseCompliance(clause.id, status, opportunityId)
      if (!result.success) {
        addToast('error', result.error ?? 'Failed to update')
      }
    })
  }

  const handleRiskChange = (level: string) => {
    startTransition(async () => {
      const result = await updateClauseRisk(clause.id, level, opportunityId)
      if (!result.success) {
        addToast('error', result.error ?? 'Failed to update')
      }
    })
  }

  const handleSaveNotes = () => {
    startTransition(async () => {
      const result = await updateClauseNotes(clause.id, notes, opportunityId)
      if (result.success) {
        addToast('success', 'Notes saved')
      } else {
        addToast('error', result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">
              {clause.clause_number}
            </span>
            {clause.clause_type && (
              <span className="text-[10px] text-muted-foreground">
                ({clause.clause_type})
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-foreground">
            {clause.clause_title ?? 'Untitled Clause'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Risk badge */}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskColor(
              clause.risk_level
            )}`}
          >
            {clause.risk_level ?? 'Unrated'}
          </span>

          {/* Compliance badge */}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${complianceColor(
              clause.compliance_status
            )}`}
          >
            {clause.compliance_status ?? 'Pending'}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {/* Full text */}
          {clause.full_text && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Clause Text
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs text-foreground">
                {clause.full_text}
              </pre>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Risk Level</p>
              <Select
                value={clause.risk_level ?? ''}
                onValueChange={handleRiskChange}
                disabled={isPending}
              >
                <SelectTrigger className="h-7 w-[110px] text-xs">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue placeholder="Set risk" />}
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Compliance</p>
              <Select
                value={clause.compliance_status ?? ''}
                onValueChange={handleComplianceChange}
                disabled={isPending}
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue placeholder="Set status" />}
                </SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">
              Legal Review Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Add notes about this clause..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              disabled={isPending || notes === (clause.notes ?? '')}
              className="mt-2"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Save Notes'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
