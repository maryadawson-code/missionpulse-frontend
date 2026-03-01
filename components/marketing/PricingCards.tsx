'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/gtag'

// Amendment A-1 pricing
const PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    monthlyPrice: 149,
    annualPrice: 1484,
    annualMonthly: 123.67,
    tokensPerMonth: '500K',
    overageRate: '$0.80',
    description: 'For solo consultants and small firms',
    features: [
      '5 active opportunities',
      'Solo Mode AI assistance',
      'SAM.gov integration',
      'Basic compliance tracking',
      'Email support',
      '500K tokens/month',
    ],
    highlighted: false,
    cta: 'Start Free Pilot',
  },
  {
    name: 'Professional',
    slug: 'professional',
    monthlyPrice: 499,
    annualPrice: 4970,
    annualMonthly: 414.17,
    tokensPerMonth: '2M',
    overageRate: '$0.60',
    description: 'For growing GovCon firms',
    features: [
      '25 active opportunities',
      'Full AI agent suite (8 agents)',
      'All integrations',
      'Team collaboration (10 users)',
      'Priority support',
      'CUI-protected modules',
      '2M tokens/month',
    ],
    highlighted: true,
    cta: 'Start Free Pilot',
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    monthlyPrice: 2500,
    annualPrice: 24900,
    annualMonthly: 2075,
    tokensPerMonth: '10M',
    overageRate: '$0.40',
    description: 'For large GovCon organizations',
    features: [
      'Unlimited opportunities',
      'Custom AI model tuning',
      'SSO / SAML',
      'Unlimited users',
      'Dedicated CSM',
      'On-premises deployment option',
      'Custom integrations',
      '10M tokens/month',
    ],
    highlighted: false,
    cta: 'Contact Sales',
  },
]

const FEATURE_COMPARISON = [
  { feature: 'Active Opportunities', starter: '5', professional: '25', enterprise: 'Unlimited' },
  { feature: 'AI Agents', starter: 'Solo Mode', professional: 'All 8 agents', enterprise: 'All 8 + custom' },
  { feature: 'Team Members', starter: '1', professional: '10', enterprise: 'Unlimited' },
  { feature: 'Tokens per Month', starter: '500K', professional: '2M', enterprise: '10M' },
  { feature: 'Overage Rate (per MTok)', starter: '$0.80', professional: '$0.60', enterprise: '$0.40' },
  { feature: 'SAM.gov Integration', starter: true, professional: true, enterprise: true },
  { feature: 'Compliance Tracking', starter: 'Basic', professional: 'Full', enterprise: 'Full + Custom' },
  { feature: 'CUI Protection', starter: false, professional: true, enterprise: true },
  { feature: 'Document Generation', starter: true, professional: true, enterprise: true },
  { feature: 'Knowledge Graph', starter: false, professional: false, enterprise: true },
  { feature: 'Custom AI Models', starter: false, professional: false, enterprise: true },
  { feature: 'SSO / SAML', starter: false, professional: false, enterprise: true },
  { feature: 'Support', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated CSM' },
]

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatMonthly(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(true)

  useEffect(() => {
    trackEvent('pricing_page_view')
  }, [])

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span
          className={`text-sm font-medium ${
            !isAnnual ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => {
            const next = !isAnnual
            setIsAnnual(next)
            trackEvent('plan_selected', { billing_interval: next ? 'annual' : 'monthly' })
          }}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            isAnnual ? 'bg-primary' : 'bg-muted'
          }`}
          aria-label="Toggle annual billing"
        >
          <div
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              isAnnual ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            isAnnual ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Annual
        </span>
        {isAnnual && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            Save 17%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-8 ${
              plan.highlighted
                ? 'border-primary/50 bg-primary/5'
                : 'border-border bg-card/30'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-[#00050F]">
                Most Popular
              </div>
            )}

            <h3 className="text-xl font-bold">{plan.name}</h3>

            <div className="mt-4 flex items-baseline gap-1">
              {isAnnual ? (
                <>
                  <span className="text-4xl font-bold">
                    ${formatMonthly(plan.annualMonthly)}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">
                    ${formatPrice(plan.monthlyPrice)}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </>
              )}
            </div>

            {isAnnual && (
              <p className="mt-1 text-xs text-muted-foreground">
                ${formatPrice(plan.annualPrice)}/year — billed annually
              </p>
            )}

            {isAnnual && plan.annualPrice < 15000 && (
              <p className="mt-1 text-xs text-green-400">
                Below $15K micro-purchase threshold (FAR 13.2)
              </p>
            )}

            <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>

            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.slug === 'enterprise' ? '/signup?plan=enterprise' : `/signup?plan=${plan.slug}`}
              onClick={() =>
                trackEvent('pilot_signup_click', {
                  plan_tier: plan.slug,
                  billing_interval: isAnnual ? 'annual' : 'monthly',
                  source: 'pricing_page',
                })
              }
              className={`mt-8 block rounded-lg px-6 py-3 text-center text-sm font-medium transition-colors ${
                plan.highlighted
                  ? 'bg-primary text-[#00050F] hover:bg-primary/90'
                  : 'border border-border text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="mt-24">
        <h3 className="mb-8 text-center text-2xl font-bold">
          Feature Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-4 pr-8 text-left font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="pb-4 px-4 text-center font-medium text-muted-foreground">
                  Starter
                </th>
                <th className="pb-4 px-4 text-center font-medium text-primary">
                  Professional
                </th>
                <th className="pb-4 pl-4 text-center font-medium text-muted-foreground">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {FEATURE_COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-8 text-muted-foreground">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    <FeatureCell value={row.starter} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <FeatureCell value={row.professional} />
                  </td>
                  <td className="py-3 pl-4 text-center">
                    <FeatureCell value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" />
  }
  if (value === false) {
    return <span className="text-muted-foreground">—</span>
  }
  return <span className="text-muted-foreground">{value}</span>
}
