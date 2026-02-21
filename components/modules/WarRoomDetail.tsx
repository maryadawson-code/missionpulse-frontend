// filepath: components/modules/WarRoomDetail.tsx
'use client'

/**
 * WarRoomDetail — Opportunity Command Center
 * Shows phase progression, key metrics, gate status, and actions
 * © 2026 Mission Meets Tech
 */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateOpportunityPhase } from '@/lib/actions/opportunities'
import type { Opportunity } from '@/lib/supabase/types'
import { ACTIVE_STAGES } from '@/lib/utils/constants'

interface Props {
  opportunity: Opportunity
}

export default function WarRoomDetail({ opportunity }: Props) {
  const opp = opportunity
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const currentPhaseIndex = ACTIVE_STAGES.findIndex((s) => s.name === opp.phase)

  const pwinColor =
    (opp.pwin || 0) >= 70
      ? 'text-emerald-400'
      : (opp.pwin || 0) >= 40
        ? 'text-amber-400'
        : 'text-red-400'

  const handlePhaseAdvance = async () => {
    if (currentPhaseIndex < 0 || currentPhaseIndex >= ACTIVE_STAGES.length - 1) return
    const nextPhase = ACTIVE_STAGES[currentPhaseIndex + 1].name
    setSaving(true)
    await updateOpportunityPhase(opp.id, nextPhase)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/pipeline"
            className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#00E5FA]"
          >
            ← Back to Pipeline
          </Link>
          <h1 className="text-2xl font-bold text-white">{opp.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {opp.agency && (
              <span className="rounded bg-white/10 px-2 py-1 text-xs text-slate-300">
                {opp.agency}
              </span>
            )}
            {opp.set_aside && (
              <span className="rounded bg-[#00E5FA]/10 px-2 py-1 text-xs text-[#00E5FA]">
                {opp.set_aside}
              </span>
            )}
            {opp.contract_vehicle && (
              <span className="rounded bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                {opp.contract_vehicle}
              </span>
            )}
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">
              Status: {opp.status}
            </span>
          </div>
        </div>

        {/* Advance Gate */}
        {currentPhaseIndex >= 0 && currentPhaseIndex < ACTIVE_STAGES.length - 1 && (
          <button
            onClick={handlePhaseAdvance}
            disabled={saving}
            className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-semibold text-[#00050F] transition-colors hover:bg-[#00E5FA]/80 disabled:opacity-50"
          >
            {saving ? 'Saving...' : `Advance → ${ACTIVE_STAGES[currentPhaseIndex + 1]?.name}`}
          </button>
        )}
      </div>

      {/* Phase Progression Bar */}
      <div className="rounded-xl border border-white/10 bg-[#000A1A] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Shipley Phase Progression
        </p>
        <div className="flex items-center gap-1">
          {ACTIVE_STAGES.map((stage, i) => {
            const isCurrent = stage.name === opp.phase
            const isPast = i < currentPhaseIndex
            return (
              <div key={stage.name} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`h-2 w-full rounded-full transition-colors ${
                    isCurrent
                      ? 'bg-[#00E5FA]'
                      : isPast
                        ? 'bg-[#00E5FA]/40'
                        : 'bg-white/10'
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    isCurrent ? 'font-semibold text-[#00E5FA]' : 'text-slate-500'
                  }`}
                >
                  {stage.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Contract Ceiling" value={formatCeiling(opp.ceiling)} />
        <MetricCard
          label="Win Probability"
          value={`${opp.pwin ?? 0}%`}
          valueClass={pwinColor}
        />
        <MetricCard label="Due Date" value={formatDate(opp.due_date)} />
        <MetricCard label="Set-Aside" value={opp.set_aside || '—'} />
      </div>

      {/* Two-column details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Opportunity Details */}
        <div className="rounded-xl border border-white/10 bg-[#000A1A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Opportunity Details</h2>
          <dl className="space-y-3">
            <DetailRow label="Solicitation #" value={opp.solicitation_number} />
            <DetailRow label="Contract Vehicle" value={opp.contract_vehicle} />
            <DetailRow
              label="Period of Performance"
              value={opp.pop_start ? `${opp.pop_start.slice(0,10)} – ${opp.pop_end?.slice(0,10) ?? 'TBD'}` : null}
            />
            <DetailRow label="Place of Performance" value={opp.place_of_performance} />
            <DetailRow label="NAICS Code" value={opp.naics_code} />
            <DetailRow label="Incumbent" value={opp.incumbent} />
          </dl>
        </div>

        {/* Right: Strategy Summary */}
        <div className="rounded-xl border border-white/10 bg-[#000A1A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Capture Strategy</h2>
          <dl className="space-y-3">
            <DetailRow label="Win Theme" value={null} />
            <DetailRow label="Ghost Statement" value={null} />
            <DetailRow label="Discriminators" value={null} />
            <DetailRow label="Customer Pain" value={null} />
            <DetailRow label="Teaming Partners" value={null} />
          </dl>
          <p className="mt-4 text-[10px] text-slate-600 italic">
            Capture strategy fields available after custom_properties migration.
          </p>
        </div>
      </div>

      {/* Activity Placeholder */}
      <div className="rounded-xl border border-white/10 bg-[#000A1A] p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Activity Timeline</h2>
        <p className="text-xs text-slate-500">
          Activity feed and collaboration coming in Sprint 3.
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#000A1A] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-right text-xs text-slate-300">{value || '—'}</dd>
    </div>
  )
}

function formatCeiling(value: number | null | undefined): string {
  if (!value) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
