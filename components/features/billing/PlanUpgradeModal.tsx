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
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
        <p className="mt-1 text-sm text-gray-400">
          Choose a plan that fits your team&apos;s needs.
        </p>

        {/* Billing toggle */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-1 text-[10px] text-cyan-300">Save 17%</span>
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
                    ? 'border-cyan-500/50 bg-cyan-900/10'
                    : 'border-border bg-card hover:border-cyan-700/30'
                }`}
              >
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    ${price.toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">/mo</span>
                  {billingInterval === 'annual' && (
                    <p className="text-xs text-cyan-400">
                      ${plan.annual_price.toFixed(0)}/year
                    </p>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {formatTokens(plan.monthly_token_limit)} tokens/mo
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {plan.max_opportunities === -1 ? 'Unlimited' : plan.max_opportunities} opportunities
                  </li>
                  {plan.features.integrations && (
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-cyan-400" />
                      Integrations
                    </li>
                  )}
                  {plan.features.fine_tuning && (
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-cyan-400" />
                      Fine-tuning
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.slug)}
                  disabled={isCurrent || loading !== null}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50'
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
