'use client'

import { useState } from 'react'
import { LCATGrid } from '@/components/features/pricing/LCATGrid'
import { PriceToWinAnalysis } from '@/components/features/pricing/PriceToWinAnalysis'
import { BOETable } from '@/components/features/pricing/BOETable'

interface PricingModel {
  id: string
  name: string
  contract_type: string | null
  status: string | null
  version: string | null
  total_price: number | null
  total_direct_labor: number | null
  base_period_months: number | null
}

interface PricingItem {
  id: string
  description: string | null
  clin: string | null
  labor_category: string | null
  unit: string | null
  quantity: number | null
  unit_price: number | null
  proposed_rate: number | null
  gsa_rate: number | null
  extended_price: number | null
  basis_of_estimate: string | null
}

interface LaborCategory {
  id: string
  family: string
  level_name: string
  level: number | null
  gsa_lcat: string | null
  bill_rate_low: number | null
  bill_rate_high: number | null
  years_experience: number | null
}

interface BOEEntry {
  id: string
  wbs_number: string | null
  task_description: string | null
  labor_category_id: string | null
  period: string | null
  total_hours: number | null
  rate_used: number | null
  extended_cost: number | null
  assumptions: string | null
}

interface PricingPageClientProps {
  models: PricingModel[]
  items: PricingItem[]
  lcats: LaborCategory[]
  boeEntries: BOEEntry[]
  lcatMap: Record<string, string>
  pipelineCeiling: number
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRate(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'approved':
    case 'final':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'in_review':
    case 'review':
      return 'bg-amber-500/20 text-amber-300'
    case 'draft':
      return 'bg-slate-500/20 text-slate-300'
    default:
      return 'bg-gray-500/20 text-muted-foreground'
  }
}

const TABS = ['Models', 'BOE', 'LCAT', 'Price-to-Win'] as const
type Tab = (typeof TABS)[number]

export function PricingPageClient({
  models,
  items,
  lcats,
  boeEntries,
  lcatMap,
  pipelineCeiling,
}: PricingPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Models')

  const totalValue = models.reduce((sum, m) => sum + (m.total_price ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Models Tab */}
      {activeTab === 'Models' && (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card/50">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Pricing Models</h2>
                <p className="text-xs text-muted-foreground mt-1">Contract pricing structures and cost volumes</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Modeled Value</p>
                <p className="text-lg font-bold font-mono text-primary">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contract Type</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Version</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direct Labor</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period (mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {models.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No pricing models created yet. Models will appear as cost volumes are developed.
                      </td>
                    </tr>
                  ) : (
                    models.map((model) => (
                      <tr key={model.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{model.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {(model.contract_type ?? 'FFP').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(model.status)}`}>
                            {(model.status ?? 'draft').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{model.version ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-foreground">{formatCurrency(model.total_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">{formatCurrency(model.total_direct_labor)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{model.base_period_months ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/50">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Pricing Line Items</h2>
              <p className="text-xs text-muted-foreground mt-1">CLIN-level pricing with labor categories and rates</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CLIN</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Labor Cat</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proposed Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No line items yet. Add CLINs and labor categories to build out pricing.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{item.clin ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">{item.description}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{item.labor_category ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">
                          {item.quantity ?? '—'} {item.unit ?? ''}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{formatRate(item.unit_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{formatRate(item.proposed_rate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-foreground">{formatCurrency(item.extended_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {models.length} pricing model{models.length !== 1 ? 's' : ''}, {items.length} line item{items.length !== 1 ? 's' : ''}. Pricing data is classified CUI//SP-PROPIN.
          </p>
        </>
      )}

      {/* BOE Tab */}
      {activeTab === 'BOE' && (
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Basis of Estimate</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Hours per labor category per period with rate assumptions and extended costs.
          </p>
          <BOETable entries={boeEntries} lcatMap={lcatMap} />
        </div>
      )}

      {/* LCAT Tab */}
      {activeTab === 'LCAT' && (
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Labor Category Rate Table</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Company-wide labor categories with billing rate ranges and GSA schedule mappings.
          </p>
          <LCATGrid categories={lcats} />
        </div>
      )}

      {/* Price-to-Win Tab */}
      {activeTab === 'Price-to-Win' && (
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Price-to-Win Analysis</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Three pricing scenarios showing competitive positioning and win probability estimates.
          </p>
          <PriceToWinAnalysis ceiling={pipelineCeiling > 0 ? pipelineCeiling : null} />
        </div>
      )}
    </div>
  )
}
