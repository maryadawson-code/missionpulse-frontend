'use client'

import { useState } from 'react'
import { TokenGauge } from '@/components/features/admin/TokenGauge'
import { TokenPackCards } from '@/components/features/billing/TokenPackCards'
import { PlanUpgradeModal } from '@/components/features/billing/PlanUpgradeModal'
import { toggleAutoOverage } from '@/lib/billing/checkout'

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

interface Balance {
  allocated: number
  consumed: number
  purchased: number
  overage_used: number
  remaining: number
  total_available: number
  usage_percent: number
  period_start: string
  period_end: string
}

interface BillingDashboardProps {
  plans: Plan[]
  currentPlanSlug: string | null
  billingInterval: 'monthly' | 'annual'
  balance: Balance | null
  isExecutive: boolean
  autoOverageEnabled: boolean
}

export function BillingDashboard({
  plans,
  currentPlanSlug,
  billingInterval,
  balance,
  isExecutive,
  autoOverageEnabled,
}: BillingDashboardProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [overageEnabled, setOverageEnabled] = useState(autoOverageEnabled)
  const [overageLoading, setOverageLoading] = useState(false)

  const currentPlan = plans.find((p) => p.slug === currentPlanSlug)
  const planName = currentPlan?.name ?? 'No Plan'

  async function handleOverageToggle() {
    setOverageLoading(true)
    try {
      const newValue = !overageEnabled
      const result = await toggleAutoOverage(newValue)
      if (result.success) {
        setOverageEnabled(newValue)
      }
    } finally {
      setOverageLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Current Plan
            </p>
            <p className="mt-1 text-xl font-bold text-white">{planName}</p>
            <p className="text-sm text-gray-400">
              {billingInterval === 'annual' ? 'Annual' : 'Monthly'} billing
              {currentPlan && (
                <span>
                  {' '}— ${billingInterval === 'annual'
                    ? currentPlan.annual_price.toFixed(0)
                    : currentPlan.monthly_price.toFixed(0)}
                  /{billingInterval === 'annual' ? 'yr' : 'mo'}
                </span>
              )}
            </p>
          </div>
          {isExecutive && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
            >
              {currentPlanSlug ? 'Change Plan' : 'Subscribe'}
            </button>
          )}
        </div>

        {/* Auto-overage toggle (enterprise only) */}
        {isExecutive && currentPlanSlug === 'enterprise' && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-white">Auto-Overage Billing</p>
              <p className="text-xs text-gray-500">
                Automatically charge overage rate instead of blocking AI features
              </p>
            </div>
            <button
              onClick={handleOverageToggle}
              disabled={overageLoading}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                overageEnabled ? 'bg-cyan-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  overageEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Token gauge */}
      {balance && (
        <TokenGauge
          consumed={balance.consumed}
          allocated={balance.allocated}
          purchased={balance.purchased}
          planName={planName}
          usagePercent={balance.usage_percent}
          showUpgradeCta={false}
        />
      )}

      {/* Token packs */}
      {isExecutive && <TokenPackCards />}

      {/* Not executive notice */}
      {!isExecutive && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-gray-400">
            Contact your administrator to manage billing and purchase tokens.
          </p>
        </div>
      )}

      {/* Upgrade modal */}
      <PlanUpgradeModal
        plans={plans}
        currentPlanSlug={currentPlanSlug}
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  )
}
