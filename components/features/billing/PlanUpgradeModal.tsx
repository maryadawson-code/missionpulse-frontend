/**
 * Plan Upgrade Modal — Select plan + billing interval, redirect to Stripe.
 */
'use client'

import { useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { initiatePlanUpgrade } from '@/lib/billing/checkout'

interface Plan {
  slug: string
  name: string
  monthly_price: number
  annual_price: number
  monthly_token_limit: number
  max_users: number
  max_opportunities: number
  features: Record<string, boolean>
}

interface PlanUpgradeModalProps {
  plans: Plan[]
  currentPlanSlug: string | null
  open: boolean
  onClose: () => void
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function PlanUpgradeModal({
  plans,
  currentPlanSlug,
  open,
  onClose,
}: PlanUpgradeModalProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  if (!open) return null

  async function handleUpgrade(planSlug: string) {
    setLoading(planSlug)
    try {
      const result = await initiatePlanUpgrade(planSlug, billingInterval)
      if (result.url) {
        window.location.href = result.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-[#0A0F1C] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-foreground">Upgrade Your Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a plan that fits your team&apos;s needs.
        </p>

        {/* Billing toggle */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span className="ml-1 text-[10px] text-primary">Save 17%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentPlanSlug
            const price = billingInterval === 'annual'
              ? plan.annual_price / 12
              : plan.monthly_price

            return (
              <div
                key={plan.slug}
                className={`rounded-xl border p-5 transition-colors ${
                  isCurrent
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">
                    ${price.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                  {billingInterval === 'annual' && (
                    <p className="text-xs text-primary">
                      ${plan.annual_price.toFixed(0)}/year
                    </p>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {formatTokens(plan.monthly_token_limit)} tokens/mo
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {plan.max_opportunities === -1 ? 'Unlimited' : plan.max_opportunities} opportunities
                  </li>
                  {plan.features.integrations && (
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Integrations
                    </li>
                  )}
                  {plan.features.fine_tuning && (
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Fine-tuning
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.slug)}
                  disabled={isCurrent || loading !== null}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                  }`}
                >
                  {loading === plan.slug ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Upgrade'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
