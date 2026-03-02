'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { OnboardingProgress } from '@/lib/billing/onboarding'

interface PilotChecklistProps {
  progress: OnboardingProgress
  isSoloUser?: boolean
}

export function PilotChecklist({ progress: initialProgress, isSoloUser = false }: PilotChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  // Filter out "invite_team" step for solo users
  const steps = isSoloUser
    ? initialProgress.steps.filter((s) => s.id !== 'invite_team')
    : initialProgress.steps

  const completedCount = steps.filter((s) => s.completed).length
  const totalSteps = steps.length
  const percentComplete = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  const allComplete = completedCount === totalSteps

  if (dismissed || allComplete) return null

  return (
    <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-card to-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Getting Started
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Complete these steps to get the most out of MissionPulse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-primary">
            {completedCount}/{totalSteps}
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-border">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
              step.completed
                ? 'bg-green-50 dark:bg-green-900/10'
                : 'bg-background/50 hover:bg-border/50'
            }`}
          >
            {/* Checkbox */}
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                step.completed
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-border'
              }`}
            >
              {step.completed && (
                <svg
                  className="h-3 w-3 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>

            {!step.completed && (
              <svg
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </Link>
        ))}
      </div>

      {completedCount === totalSteps - 1 && (
        <p className="mt-3 text-center text-xs text-primary/80">
          Almost there! Complete the last step to finish onboarding.
        </p>
      )}
    </div>
  )
}
