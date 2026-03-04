'use client'

import { useState, useTransition } from 'react'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/lib/utils/onboarding'

interface GuidedTourProps {
  show: boolean
  userName?: string | null
}

export function GuidedTour({ show, userName }: GuidedTourProps) {
  const [visible, setVisible] = useState(show)
  const [isPending, startTransition] = useTransition()

  if (!visible) return null

  function handleDismiss() {
    startTransition(async () => {
      await completeOnboarding()
      setVisible(false)
    })
  }

  const greeting = userName ? `Welcome, ${userName.split(' ')[0]}!` : 'Welcome to MissionPulse!'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground">{greeting}</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We&apos;ve set up a sample opportunity so you can see MissionPulse in action.
            Here&apos;s what to do next:
          </p>
        </div>

        {/* Inline checklist preview */}
        <div className="mb-6 space-y-2.5">
          {[
            { label: 'Explore the sample opportunity', desc: 'See how pipeline tracking works' },
            { label: 'Upload an RFP document', desc: 'Let the AI extract requirements' },
            { label: 'Ask the AI a question', desc: 'Get instant proposal guidance' },
            { label: 'Review your compliance matrix', desc: 'Track requirements coverage' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleDismiss}
          disabled={isPending}
        >
          <Rocket className="mr-2 h-4 w-4" />
          {isPending ? 'Getting started...' : "Let's Go"}
        </Button>
      </div>
    </div>
  )
}
