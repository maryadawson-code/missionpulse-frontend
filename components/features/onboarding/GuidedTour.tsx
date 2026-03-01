'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/lib/utils/onboarding'

const TOUR_STEPS = [
  {
    title: 'Welcome to MissionPulse',
    description:
      'Your AI-powered federal proposal management platform. Let\'s take a quick tour of the key features.',
    href: '/',
    icon: '🎯',
  },
  {
    title: 'Pipeline',
    description:
      'Track all your opportunities through Shipley phases — from pre-RFP to submission. Create, sort, filter, and manage your entire pipeline.',
    href: '/pipeline',
    icon: '📊',
  },
  {
    title: 'Create an Opportunity',
    description:
      'Add new opportunities manually or import from SAM.gov. Set agency, NAICS, ceiling, due dates, and let AI calculate your pWin.',
    href: '/pipeline',
    icon: '➕',
  },
  {
    title: 'RFP Shredder',
    description:
      'Upload an RFP and extract requirements automatically. Build your compliance matrix with AI assistance — every SHALL and MUST statement captured.',
    href: '/pipeline',
    icon: '📄',
  },
  {
    title: 'AI Assistant',
    description:
      'Ask questions about your opportunities, get strategy recommendations, draft proposal sections, and analyze competitors — all powered by AskSage.',
    href: '/ai',
    icon: '🤖',
  },
]

interface GuidedTourProps {
  show: boolean
}

export function GuidedTour({ show }: GuidedTourProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(show)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  function handleSkip() {
    startTransition(async () => {
      await completeOnboarding()
      setVisible(false)
    })
  }

  function handleNext() {
    if (isLast) {
      startTransition(async () => {
        await completeOnboarding()
        setVisible(false)
        router.push('/pipeline')
      })
    } else {
      setStep((s) => s + 1)
    }
  }

  function handlePrev() {
    if (step > 0) setStep((s) => s - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          disabled={isPending}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">{current.icon}</div>
          <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step counter */}
        <p className="mb-4 text-center text-xs text-muted-foreground">
          Step {step + 1} of {TOUR_STEPS.length}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={step === 0 || isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            Skip Tour
          </button>

          <Button size="sm" onClick={handleNext} disabled={isPending}>
            {isLast ? (
              <>
                <Rocket className="h-4 w-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
