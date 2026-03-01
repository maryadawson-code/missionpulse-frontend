'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  createCostVolume,
  addLaborCategory,
  updateCostVolumeRates,
} from '@/app/(dashboard)/pipeline/[id]/pricing/actions'

interface LaborCategory {
  id: string
  labor_category: string
  level: string | null
  headcount: number | null
  hourly_rate: number | null
  loaded_rate: number | null
  annual_hours: number | null
  total_hours: number | null
  total_cost: number | null
  sort_order: number | null
}

interface CostVolume {
  id: string
  volume_name: string
  status: string | null
  contract_type: string | null
  base_period_months: number | null
  fringe_rate: number | null
  overhead_rate: number | null
  ga_rate: number | null
  wrap_rate: number | null
  fee_percent: number | null
  direct_labor_total: number | null
  total_proposed: number | null
  cost_labor_categories: LaborCategory[]
}

interface CostVolumeManagerProps {
  opportunityId: string
  costVolumes: CostVolume[]
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatRate(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

export function CostVolumeManager({
  opportunityId,
  costVolumes,
}: CostVolumeManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showNewVolume, setShowNewVolume] = useState(false)
  const [showNewLCAT, setShowNewLCAT] = useState<string | null>(null)
  const [showRates, setShowRates] = useState<string | null>(null)

  function handleCreateVolume(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    startTransition(async () => {
      const result = await createCostVolume(formData)
      if (result.success) {
        addToast('success', 'Cost volume created')
        setShowNewVolume(false)
      } else {
        addToast('error', result.error ?? 'Failed to create volume')
      }
    })
  }

  function handleAddLCAT(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    startTransition(async () => {
      const result = await addLaborCategory(formData)
      if (result.success) {
        addToast('success', 'Labor category added')
        setShowNewLCAT(null)
      } else {
        addToast('error', result.error ?? 'Failed to add labor category')
      }
    })
  }

  function handleUpdateRates(formData: FormData) {
    formData.set('opportunityId', opportunityId)
    startTransition(async () => {
      const result = await updateCostVolumeRates(formData)
      if (result.success) {
        addToast('success', 'Rates updated')
        setShowRates(null)
      } else {
        addToast('error', result.error ?? 'Failed to update rates')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Cost Volumes ({costVolumes.length})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewVolume(!showNewVolume)}
        >
          <Plus className="h-4 w-4" />
          New Volume
        </Button>
      </div>

      {/* New Volume Form */}
      {showNewVolume && (
        <form
          action={handleCreateVolume}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Volume Name
              </label>
              <input
                name="volumeName"
                required
                placeholder="e.g., Base Period Cost Volume"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Contract Type
              </label>
              <select
                name="contractType"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="FFP">Firm Fixed Price</option>
                <option value="T&M">Time & Materials</option>
                <option value="CPFF">Cost Plus Fixed Fee</option>
                <option value="CPAF">Cost Plus Award Fee</option>
                <option value="IDIQ">IDIQ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Base Period (months)
              </label>
              <input
                name="basePeriodMonths"
                type="number"
                defaultValue={12}
                min={1}
                max={60}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Volume
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewVolume(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Cost Volumes */}
      {costVolumes.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No cost volumes yet. Create a cost volume to start building your pricing.
        </div>
      ) : (
        costVolumes.map((vol) => (
          <div key={vol.id} className="rounded-xl border border-border bg-card">
            {/* Volume Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {vol.volume_name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {(vol.contract_type ?? 'FFP').replace(/_/g, ' ')} |{' '}
                  {vol.base_period_months ?? 12} months |{' '}
                  <span
                    className={`${vol.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    {vol.status ?? 'draft'}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Proposed</p>
                <p className="text-lg font-bold font-mono text-primary">
                  {formatCurrency(vol.total_proposed)}
                </p>
              </div>
            </div>

            {/* Wrap Rates Summary */}
            <div className="grid grid-cols-5 gap-px bg-border text-center">
              {[
                { label: 'Fringe', value: vol.fringe_rate },
                { label: 'Overhead', value: vol.overhead_rate },
                { label: 'G&A', value: vol.ga_rate },
                { label: 'Fee', value: vol.fee_percent },
                { label: 'Wrap Rate', value: vol.wrap_rate },
              ].map((rate) => (
                <div key={rate.label} className="bg-card px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {rate.label}
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {rate.label === 'Wrap Rate'
                      ? (rate.value ?? 1).toFixed(3)
                      : formatRate(rate.value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Edit Rates Button */}
            <div className="px-5 py-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowRates(showRates === vol.id ? null : vol.id)
                }
              >
                Edit Wrap Rates
              </Button>

              {showRates === vol.id && (
                <form
                  action={handleUpdateRates}
                  className="mt-3 space-y-3"
                >
                  <input type="hidden" name="costVolumeId" value={vol.id} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { name: 'fringeRate', label: 'Fringe %', def: vol.fringe_rate },
                      { name: 'overheadRate', label: 'Overhead %', def: vol.overhead_rate },
                      { name: 'gaRate', label: 'G&A %', def: vol.ga_rate },
                      { name: 'feePercent', label: 'Fee %', def: vol.fee_percent },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-xs text-muted-foreground mb-1">
                          {field.label}
                        </label>
                        <input
                          name={field.name}
                          type="number"
                          step="0.1"
                          defaultValue={field.def ?? 0}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Rates
                  </Button>
                </form>
              )}
            </div>

            {/* Labor Categories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Labor Category
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Level
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      HC
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Hourly Rate
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Loaded Rate
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Annual Hrs
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vol.cost_labor_categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-xs text-muted-foreground"
                      >
                        No labor categories. Add LCATs to build cost structure.
                      </td>
                    </tr>
                  ) : (
                    vol.cost_labor_categories.map((lcat) => (
                      <tr
                        key={lcat.id}
                        className="transition-colors hover:bg-muted/10"
                      >
                        <td className="px-4 py-2 text-sm text-foreground">
                          {lcat.labor_category}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {lcat.level ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-foreground">
                          {lcat.headcount ?? 0}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-foreground">
                          {formatCurrency(lcat.hourly_rate)}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-foreground">
                          {formatCurrency(lcat.loaded_rate)}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-muted-foreground">
                          {(lcat.annual_hours ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-foreground">
                          {formatCurrency(lcat.total_cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add LCAT Form */}
            <div className="px-5 py-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowNewLCAT(showNewLCAT === vol.id ? null : vol.id)
                }
              >
                <Plus className="h-3 w-3" />
                Add Labor Category
              </Button>

              {showNewLCAT === vol.id && (
                <form
                  action={handleAddLCAT}
                  className="mt-3 space-y-3"
                >
                  <input type="hidden" name="costVolumeId" value={vol.id} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Labor Category
                      </label>
                      <input
                        name="laborCategory"
                        required
                        placeholder="e.g., Senior Engineer"
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Level
                      </label>
                      <input
                        name="level"
                        placeholder="e.g., III"
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Headcount
                      </label>
                      <input
                        name="headcount"
                        type="number"
                        min={1}
                        defaultValue={1}
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Hourly Rate ($)
                      </label>
                      <input
                        name="hourlyRate"
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Annual Hours
                      </label>
                      <input
                        name="annualHours"
                        type="number"
                        defaultValue={1880}
                        min={1}
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Add LCAT
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
