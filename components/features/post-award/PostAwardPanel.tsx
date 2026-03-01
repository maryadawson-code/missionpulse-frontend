'use client'

import { useState, useTransition } from 'react'
import {
  Loader2,
  Trophy,
  XCircle,
  Ban,
  AlertTriangle,
  BookOpen,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  recordOutcome,
  saveDebrief,
  addLessonLearned,
} from '@/app/(dashboard)/pipeline/[id]/post-award/actions'

interface Debrief {
  id: string
  outcome: string | null
  strengths: unknown
  weaknesses: unknown
  evaluator_feedback: unknown
  notes: string | null
  debrief_date: string | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  category: string | null
  recommendation: string | null
}

interface PostAwardPanelProps {
  opportunityId: string
  currentStatus: string
  debriefs: Debrief[]
  lessons: Lesson[]
}

const OUTCOMES = [
  { value: 'won', label: 'Won', icon: Trophy, color: 'text-emerald-400' },
  { value: 'lost', label: 'Lost', icon: XCircle, color: 'text-red-400' },
  { value: 'no_bid', label: 'No Bid', icon: Ban, color: 'text-gray-400' },
  { value: 'protest', label: 'Protest', icon: AlertTriangle, color: 'text-amber-400' },
]

export function PostAwardPanel({
  opportunityId,
  currentStatus,
  debriefs,
  lessons,
}: PostAwardPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [showDebrief, setShowDebrief] = useState(false)
  const [showLesson, setShowLesson] = useState(false)

  function handleOutcome(outcome: string) {
    const formData = new FormData()
    formData.set('opportunityId', opportunityId)
    formData.set('outcome', outcome)
    startTransition(async () => {
      const result = await recordOutcome(formData)
      if (result.success) {
        addToast('success', `Outcome recorded: ${outcome}`)
      } else {
        addToast('error', result.error ?? 'Failed to record outcome')
      }
    })
  }

  function handleSaveDebrief(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    formData.set('outcome', currentStatus)
    startTransition(async () => {
      const result = await saveDebrief(formData)
      if (result.success) {
        addToast('success', 'Debrief saved')
        setShowDebrief(false)
      } else {
        addToast('error', result.error ?? 'Failed to save debrief')
      }
    })
  }

  function handleAddLesson(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    formData.set('outcome', currentStatus)
    startTransition(async () => {
      const result = await addLessonLearned(formData)
      if (result.success) {
        addToast('success', 'Lesson learned saved and added to Playbook')
        setShowLesson(false)
      } else {
        addToast('error', result.error ?? 'Failed to save lesson')
      }
    })
  }

  const isOutcomeRecorded = ['won', 'lost', 'no_bid', 'protest'].includes(
    currentStatus
  )

  return (
    <div className="space-y-6">
      {/* Outcome Selection */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Opportunity Outcome
        </h3>
        {isOutcomeRecorded ? (
          <div className="flex items-center gap-3">
            {OUTCOMES.filter((o) => o.value === currentStatus).map((o) => {
              const Icon = o.icon
              return (
                <div key={o.value} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${o.color}`} />
                  <span className={`text-lg font-bold ${o.color}`}>
                    {o.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {OUTCOMES.map((o) => {
              const Icon = o.icon
              return (
                <Button
                  key={o.value}
                  variant="outline"
                  onClick={() => handleOutcome(o.value)}
                  disabled={isPending}
                >
                  <Icon className={`h-4 w-4 ${o.color}`} />
                  {o.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Debrief Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Debriefs ({debriefs.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebrief(!showDebrief)}
          >
            <Plus className="h-4 w-4" />
            Add Debrief
          </Button>
        </div>

        {showDebrief && (
          <form
            action={handleSaveDebrief}
            className="border-b border-border px-5 py-4 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Strengths Cited (one per line)
                </label>
                <textarea
                  name="strengths"
                  rows={3}
                  placeholder="Technical approach was thorough&#10;Strong past performance citations&#10;Competitive pricing"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Weaknesses Cited (one per line)
                </label>
                <textarea
                  name="weaknesses"
                  rows={3}
                  placeholder="Staffing plan lacked detail&#10;Missing key certification&#10;Price above IGCE"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Evaluator Feedback
              </label>
              <textarea
                name="evaluatorFeedback"
                rows={3}
                placeholder="Summary of evaluator comments from debrief..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Debrief
            </Button>
          </form>
        )}

        <div className="divide-y divide-border">
          {debriefs.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              No debriefs recorded yet.
            </p>
          ) : (
            debriefs.map((d) => (
              <div key={d.id} className="px-5 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {d.debrief_date
                      ? new Date(d.debrief_date).toLocaleDateString()
                      : 'No date'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Outcome: {d.outcome ?? 'Unknown'}
                  </span>
                </div>
                {d.notes && (
                  <p className="text-sm text-foreground">{d.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lessons Learned */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Lessons Learned ({lessons.length})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLesson(!showLesson)}
          >
            <Plus className="h-4 w-4" />
            Add Lesson
          </Button>
        </div>

        {showLesson && (
          <form
            action={handleAddLesson}
            className="border-b border-border px-5 py-4 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g., Always include CMMI certifications"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="technical">Technical</option>
                  <option value="management">Management</option>
                  <option value="past_performance">Past Performance</option>
                  <option value="pricing">Pricing</option>
                  <option value="process">Process</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                required
                placeholder="What happened and what did we learn?"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Recommendation
              </label>
              <textarea
                name="recommendation"
                rows={2}
                placeholder="What should we do differently next time?"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Lesson (also adds to Playbook)
            </Button>
          </form>
        )}

        <div className="divide-y divide-border">
          {lessons.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              No lessons learned yet. Add lessons to build institutional knowledge.
            </p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {lesson.title}
                  </span>
                  {lesson.category && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {lesson.category}
                    </span>
                  )}
                </div>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground">
                    {lesson.description}
                  </p>
                )}
                {lesson.recommendation && (
                  <p className="text-xs text-primary mt-1">
                    Rec: {lesson.recommendation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
