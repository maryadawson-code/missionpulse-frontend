'use client'

import { useState, useTransition } from 'react'
import { createPilotAction, convertPilotAction } from './actions'
import { EngagementGauge } from '@/components/features/admin/EngagementGauge'

// ─── Types ──────────────────────────────────────────────────

interface PilotRow {
  companyId: string
  companyName: string
  planTier: string
  pilotStartDate: string | null
  pilotEndDate: string | null
  daysRemaining: number
  status: string
  pilotAmountCents: number
  engagementScore: number
}

interface CompanyOption {
  id: string
  name: string
}

interface PilotAdminClientProps {
  pilots: PilotRow[]
  companies: CompanyOption[]
}

// ─── Helpers ────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'pilot':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'expired':
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    default:
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'pilot':
      return 'Active'
    case 'expired':
      return 'Expired'
    default:
      return status
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`
}

// ─── Component ──────────────────────────────────────────────

export default function PilotAdminClient({
  pilots: initialPilots,
  companies,
}: PilotAdminClientProps) {
  const [pilots, setPilots] = useState(initialPilots)
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Create form state
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [kpiTarget, setKpiTarget] = useState('')

  function handleCreate() {
    if (!selectedCompany) return

    const kpis: Record<string, unknown> = {}
    if (kpiTarget.trim()) {
      kpis.target = kpiTarget.trim()
    }

    startTransition(async () => {
      const result = await createPilotAction(selectedCompany, selectedPlan, kpis)
      if (result.success) {
        // Find company name
        const comp = companies.find((c) => c.id === selectedCompany)
        setPilots((prev) => [
          {
            companyId: selectedCompany,
            companyName: comp?.name ?? 'Unknown',
            planTier: selectedPlan,
            pilotStartDate: result.pilotStartDate,
            pilotEndDate: result.pilotEndDate,
            daysRemaining: 30,
            status: 'pilot',
            pilotAmountCents: result.pilotAmountCents,
            engagementScore: 0,
          },
          ...prev,
        ])
        setShowCreate(false)
        setSelectedCompany('')
        setKpiTarget('')
      }
    })
  }

  function handleConvert(companyId: string) {
    startTransition(async () => {
      const result = await convertPilotAction(companyId)
      if (result.success) {
        setPilots((prev) =>
          prev.map((p) =>
            p.companyId === companyId ? { ...p, status: 'active' } : p
          )
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {pilots.length} pilot{pilots.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
        >
          {showCreate ? 'Cancel' : 'Create Pilot'}
        </button>
      </div>

      {/* Create Pilot Form */}
      {showCreate && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">New Pilot</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan Tier</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="starter">Starter — $744/pilot</option>
                <option value="professional">Professional — $2,490/pilot</option>
                <option value="enterprise">Enterprise — $12,498/pilot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                KPI Target (optional)
              </label>
              <input
                type="text"
                value={kpiTarget}
                onChange={(e) => setKpiTarget(e.target.value)}
                placeholder="e.g., 3 proposals drafted"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!selectedCompany || isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create Pilot'}
          </button>
        </div>
      )}

      {/* Pilots Table */}
      {pilots.length === 0 ? (
        <div className="rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-sm text-gray-400">
            No pilots yet. Create a pilot to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Start
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  End
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Days Left
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Engagement
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pilots.map((pilot) => (
                <tr
                  key={pilot.companyId}
                  className="border-b border-gray-800/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {pilot.companyName}
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">
                    {pilot.planTier}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatDate(pilot.pilotStartDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatDate(pilot.pilotEndDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        pilot.daysRemaining <= 5
                          ? 'text-red-400 font-medium'
                          : 'text-gray-300'
                      }
                    >
                      {pilot.status === 'expired'
                        ? '0'
                        : pilot.daysRemaining}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EngagementGauge
                      score={pilot.engagementScore}
                      companyName={pilot.companyName}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(
                        pilot.status
                      )}`}
                    >
                      {statusLabel(pilot.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pilot.status === 'pilot' && (
                      <button
                        onClick={() => handleConvert(pilot.companyId)}
                        disabled={isPending}
                        className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                      >
                        Convert
                      </button>
                    )}
                    {pilot.status === 'expired' && (
                      <span className="text-xs text-gray-500">Expired</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
