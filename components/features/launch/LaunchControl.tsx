'use client'

import { useState, useTransition } from 'react'
import {
  Loader2,
  Rocket,
  Shield,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  Download,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { addToast } from '@/components/ui/Toast'
import {
  recordGateDecision,
  updateOpportunityStatus,
} from '@/app/(dashboard)/pipeline/[id]/launch/actions'
import { assembleBinder } from '@/app/(dashboard)/proposals/actions'

interface GateDecision {
  id: string
  gateName: string
  gateNumber: number
  decision: string
  pwinAtGate: number | null
  conditions: string[]
  createdAt: string
}

interface GateAuthority {
  canApprove: string[]
  canTriggerReview: boolean
  canOverrideGate: boolean
}

interface LaunchControlProps {
  opportunity: {
    id: string
    title: string
    status: string
    pwin: number
    dueDate: string | null
  }
  complianceStats: {
    total: number
    verified: number
    percentage: number
  }
  sectionStats?: {
    total: number
    final: number
  }
  gateDecisions: GateDecision[]
  teamCount: number
  docCount: number
  gateAuthority?: GateAuthority
}

function decisionIcon(decision: string) {
  switch (decision) {
    case 'go':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    case 'no_go':
      return <XCircle className="h-4 w-4 text-red-400" />
    case 'conditional':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function decisionColor(decision: string) {
  switch (decision) {
    case 'go':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'no_go':
      return 'bg-red-500/20 text-red-300'
    case 'conditional':
      return 'bg-amber-500/20 text-amber-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

const SHIPLEY_GATES = [
  { number: 1, name: 'Bid/No-Bid Decision' },
  { number: 2, name: 'Capture Planning' },
  { number: 3, name: 'Proposal Planning' },
  { number: 4, name: 'Proposal Preparation' },
  { number: 5, name: 'Proposal Ready for Review' },
  { number: 6, name: 'Submit/No-Submit' },
]

// Map gate numbers to authority names
const GATE_AUTHORITY_MAP: Record<number, string> = {
  1: 'gate1',
  2: 'blue',
  3: 'blue',
  4: 'red',
  5: 'gold',
  6: 'submit',
}

export function LaunchControl({
  opportunity,
  complianceStats,
  sectionStats,
  gateDecisions,
  teamCount,
  docCount,
  gateAuthority,
}: LaunchControlProps) {
  // Filter gates by user's gate authority
  const approvedGates = gateAuthority
    ? SHIPLEY_GATES.filter((g) => {
        const authorityName = GATE_AUTHORITY_MAP[g.number]
        return authorityName && gateAuthority.canApprove.includes(authorityName)
      })
    : SHIPLEY_GATES
  const canApproveAny = approvedGates.length > 0

  const [isPending, startTransition] = useTransition()
  const [showGateForm, setShowGateForm] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [binderResult, setBinderResult] = useState<{ volume: string; title: string; wordCount: number }[] | null>(null)
  const [selectedGateNumber, setSelectedGateNumber] = useState(approvedGates[0]?.number ?? 1)
  const [pendingDecision, setPendingDecision] = useState<string | null>(null)
  const [pendingConditions, setPendingConditions] = useState('')
  const [showConfirmGate, setShowConfirmGate] = useState(false)
  const [expandedGate, setExpandedGate] = useState<number | null>(null)

  const daysUntilDue = opportunity.dueDate
    ? Math.ceil(
        (new Date(opportunity.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null

  const isReadyToSubmit =
    complianceStats.percentage >= 100 &&
    gateDecisions.some((g) => g.gateNumber === 6 && g.decision === 'go')

  const hasWarnings =
    complianceStats.percentage < 100 ||
    (daysUntilDue !== null && daysUntilDue <= 2)

  const selectedGate = SHIPLEY_GATES.find((g) => g.number === selectedGateNumber)

  function handleGateFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setPendingDecision(formData.get('decision') as string)
    setPendingConditions(formData.get('conditions') as string ?? '')
    setShowConfirmGate(true)
  }

  async function confirmGateDecision(): Promise<{ success: boolean; error?: string }> {
    const formData = new FormData()
    formData.set('opportunityId', opportunity.id)
    formData.set('gateNumber', String(selectedGateNumber))
    formData.set('gateName', selectedGate?.name ?? '')
    formData.set('decision', pendingDecision ?? 'go')
    formData.set('conditions', pendingConditions)

    const result = await recordGateDecision(formData)
    if (result.success) {
      setShowGateForm(false)
      setShowConfirmGate(false)
      setPendingDecision(null)
      setPendingConditions('')
    }
    return result
  }

  function handleMarkSubmitted() {
    startTransition(async () => {
      const result = await updateOpportunityStatus(opportunity.id, 'submitted')
      if (result.success) {
        addToast('success', 'Proposal marked as submitted')
        setConfirmSubmit(false)
      } else {
        addToast('error', result.error ?? 'Failed to update status')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Readiness KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Compliance
            </p>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${complianceStats.percentage >= 100 ? 'text-emerald-400' : complianceStats.percentage >= 80 ? 'text-amber-400' : 'text-red-400'}`}
          >
            {complianceStats.percentage}%
          </p>
          <p className="text-xs text-muted-foreground">
            {complianceStats.verified}/{complianceStats.total} requirements
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase text-muted-foreground">
              pWin
            </p>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${opportunity.pwin >= 70 ? 'text-emerald-400' : opportunity.pwin >= 40 ? 'text-amber-400' : 'text-red-400'}`}
          >
            {opportunity.pwin}%
          </p>
          <p className="text-xs text-muted-foreground">
            Probability of win
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Deadline
            </p>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${daysUntilDue === null ? 'text-muted-foreground' : daysUntilDue <= 2 ? 'text-red-400' : daysUntilDue <= 7 ? 'text-amber-400' : 'text-foreground'}`}
          >
            {daysUntilDue !== null ? `${daysUntilDue}d` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Days remaining</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Team
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {teamCount}
          </p>
          <p className="text-xs text-muted-foreground">Members assigned</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Documents
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {docCount}
          </p>
          <p className="text-xs text-muted-foreground">Files uploaded</p>
        </div>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
          {complianceStats.percentage < 100 && (
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {complianceStats.total - complianceStats.verified} compliance
              requirements not yet verified
            </div>
          )}
          {daysUntilDue !== null && daysUntilDue <= 2 && (
            <div className="flex items-center gap-2 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Deadline in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}!
            </div>
          )}
        </div>
      )}

      {/* Gate Decisions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Shipley Gate Reviews
          </h3>
          {canApproveAny && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGateForm(!showGateForm)}
            >
              Record Gate Decision
            </Button>
          )}
        </div>

        {showGateForm && canApproveAny && (
          <form
            onSubmit={handleGateFormSubmit}
            className="border-b border-border px-5 py-4 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Gate
                </label>
                <select
                  name="gateNumber"
                  value={selectedGateNumber}
                  onChange={(e) => setSelectedGateNumber(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {approvedGates.map((g) => (
                    <option key={g.number} value={g.number}>
                      Gate {g.number}: {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Decision
                </label>
                <select
                  name="decision"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="go">Go</option>
                  <option value="conditional">Conditional Go</option>
                  <option value="no_go">No Go</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Conditions (one per line)
                </label>
                <textarea
                  name="conditions"
                  rows={2}
                  placeholder="Any conditions for approval..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Decision
            </Button>
          </form>
        )}

        <ConfirmModal
          open={showConfirmGate}
          onOpenChange={setShowConfirmGate}
          title={`Confirm Gate ${selectedGateNumber} Decision`}
          description={`You are recording a "${(pendingDecision ?? 'go').replace(/_/g, ' ').toUpperCase()}" decision for Gate ${selectedGateNumber}: ${selectedGate?.name ?? ''}. This action will be logged to the audit trail.`}
          confirmLabel={`Record ${(pendingDecision ?? 'go').replace(/_/g, ' ')}`}
          destructive={pendingDecision === 'no_go'}
          onConfirm={confirmGateDecision}
          successMessage="Gate decision recorded"
        />

        <div className="px-5 py-4 space-y-3">
          {SHIPLEY_GATES.map((gate) => {
            const gateHistory = gateDecisions.filter(
              (d) => d.gateNumber === gate.number
            )
            const latestDecision = gateHistory[gateHistory.length - 1]
            const isExpanded = expandedGate === gate.number
            return (
              <div key={gate.number} className="rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setExpandedGate(isExpanded ? null : gate.number)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    {latestDecision ? (
                      decisionIcon(latestDecision.decision)
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <div>
                      <p className="text-sm text-foreground">
                        Gate {gate.number}: {gate.name}
                      </p>
                      {latestDecision?.conditions && latestDecision.conditions.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Conditions: {latestDecision.conditions.join('; ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {latestDecision && (
                      <>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${decisionColor(latestDecision.decision)}`}
                        >
                          {latestDecision.decision.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {latestDecision.pwinAtGate != null && (
                          <span className="text-xs font-mono text-muted-foreground">
                            pWin: {latestDecision.pwinAtGate}%
                          </span>
                        )}
                      </>
                    )}
                    {gateHistory.length > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        {gateHistory.length} decisions
                      </span>
                    )}
                  </div>
                </button>

                {/* Expandable decision history */}
                {isExpanded && gateHistory.length > 0 && (
                  <div className="border-t border-border px-4 py-2 space-y-2">
                    {gateHistory.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {decisionIcon(d.decision)}
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${decisionColor(d.decision)}`}
                          >
                            {d.decision.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {d.conditions.length > 0 && (
                            <span className="text-muted-foreground">
                              {d.conditions.join('; ')}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pre-Submission Checklist & Binder Assembly */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Pre-Submission Checklist
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              startTransition(async () => {
                const result = await assembleBinder(opportunity.id)
                if (result.success && result.binderData) {
                  setBinderResult(result.binderData)
                  addToast('success', `Binder assembled: ${result.binderData.length} sections`)
                } else {
                  addToast('error', result.error ?? 'Assembly failed')
                }
              })
            }}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Assemble Binder
          </Button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            {complianceStats.percentage >= 100 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-foreground">
              All SHALLs mapped to sections
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {complianceStats.verified}/{complianceStats.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {sectionStats && sectionStats.total > 0 && sectionStats.final === sectionStats.total ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-foreground">
              All sections in &quot;final&quot; status
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {sectionStats?.final ?? 0}/{sectionStats?.total ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {gateDecisions.some((g) => g.gateNumber === 6 && g.decision === 'go') ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-foreground">
              Gate 6 (Submit/No-Submit) approved
            </span>
          </div>
        </div>

        {/* Binder Result */}
        {binderResult && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">
                Binder Assembled Successfully
              </span>
            </div>
            <div className="space-y-1">
              {binderResult.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">
                    <span className="text-muted-foreground">{s.volume} /</span> {s.title}
                  </span>
                  <span className="text-muted-foreground">
                    ~{s.wordCount.toLocaleString()} words
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Action */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Submission Status
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {opportunity.status === 'submitted'
                ? 'This proposal has been submitted.'
                : isReadyToSubmit
                  ? 'All gates passed and compliance verified. Ready to submit.'
                  : 'Complete all gate reviews and compliance verification before submitting.'}
            </p>
          </div>

          {opportunity.status !== 'submitted' && (
            <div>
              {confirmSubmit ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleMarkSubmitted}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Submission
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmSubmit(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmSubmit(true)}
                  disabled={!isReadyToSubmit && complianceStats.percentage < 100}
                >
                  <Rocket className="h-4 w-4" />
                  Mark as Submitted
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
