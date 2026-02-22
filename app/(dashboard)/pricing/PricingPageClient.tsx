'use client'

import { useState } from 'react'
import { LCATGrid } from '@/components/features/pricing/LCATGrid'
import { PriceToWinAnalysis } from '@/components/features/pricing/PriceToWinAnalysis'

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

interface PricingPageClientProps {
  models: PricingModel[]
  items: PricingItem[]
  lcats: LaborCategory[]
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
      return 'bg-gray-500/20 text-gray-300'
  }
}

const TABS = ['Models', 'LCAT', 'Price-to-Win'] as const
type Tab = (typeof TABS)[number]

export function PricingPageClient({
  models,
  items,
  lcats,
  pipelineCeiling,
}: PricingPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Models')

  const totalValue = models.reduce((sum, m) => sum + (m.total_price ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[#00E5FA] text-[#00E5FA]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Models Tab */}
      {activeTab === 'Models' && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Pricing Models</h2>
                <p className="text-xs text-gray-500 mt-1">Contract pricing structures and cost volumes</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Modeled Value</p>
                <p className="text-lg font-bold font-mono text-[#00E5FA]">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Model Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contract Type</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Version</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Total Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Direct Labor</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Period (mo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {models.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                        No pricing models created yet. Models will appear as cost volumes are developed.
                      </td>
                    </tr>
                  ) : (
                    models.map((model) => (
                      <tr key={model.id} className="transition-colors hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm font-medium text-gray-200">{model.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                          {(model.contract_type ?? 'FFP').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(model.status)}`}>
                            {(model.status ?? 'draft').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{model.version ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-200">{formatCurrency(model.total_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-300">{formatCurrency(model.total_direct_labor)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{model.base_period_months ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Pricing Line Items</h2>
              <p className="text-xs text-gray-500 mt-1">CLIN-level pricing with labor categories and rates</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">CLIN</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Labor Cat</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Proposed Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Extended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                        No line items yet. Add CLINs and labor categories to build out pricing.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-gray-800/30">
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-300">{item.clin ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{item.description}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{item.labor_category ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                          {item.quantity ?? '—'} {item.unit ?? ''}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">{formatRate(item.unit_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-300">{formatRate(item.proposed_rate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-200">{formatCurrency(item.extended_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            {models.length} pricing model{models.length !== 1 ? 's' : ''}, {items.length} line item{items.length !== 1 ? 's' : ''}. Pricing data is classified CUI//SP-PROPIN.
          </p>
        </>
      )}

      {/* LCAT Tab */}
      {activeTab === 'LCAT' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Labor Category Rate Table</h2>
          <p className="text-xs text-gray-500 mb-4">
            Company-wide labor categories with billing rate ranges and GSA schedule mappings.
          </p>
          <LCATGrid categories={lcats} />
        </div>
      )}

      {/* Price-to-Win Tab */}
      {activeTab === 'Price-to-Win' && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Price-to-Win Analysis</h2>
          <p className="text-xs text-gray-500 mb-4">
            Three pricing scenarios showing competitive positioning and win probability estimates.
          </p>
          <PriceToWinAnalysis ceiling={pipelineCeiling > 0 ? pipelineCeiling : null} />
        </div>
      )}
    </div>
  )
}
