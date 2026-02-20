'use client'

/**
 * OpportunityCard — Draggable pipeline card
 * Shows title, agency, ceiling, pWin, due date
 * Click navigates to War Room
 * © 2026 Mission Meets Tech
 */
import Link from 'next/link'
import type { Opportunity } from '@/lib/supabase/types'

interface Props {
  opportunity: Opportunity
  onDragStart: () => void
}

export default function OpportunityCard({ opportunity, onDragStart }: Props) {
  const opp = opportunity

  const pwinColor =
    (opp.pwin || 0) >= 70
      ? 'text-emerald-400'
      : (opp.pwin || 0) >= 40
        ? 'text-amber-400'
        : 'text-red-400'

  const pwinBg =
    (opp.pwin || 0) >= 70
      ? 'bg-emerald-500/10'
      : (opp.pwin || 0) >= 40
        ? 'bg-amber-500/10'
        : 'bg-red-500/10'

  return (
    <Link href={`/war-room/${opp.id}`}>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart()
        }}
        className="group cursor-grab rounded-lg border border-white/10 bg-[#0A1628] p-3 transition-all hover:border-[#00E5FA]/30 hover:bg-[#0A1628]/80 active:cursor-grabbing"
      >
        {/* Title + Set-Aside */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-tight text-white group-hover:text-[#00E5FA]">
            {opp.title}
          </h3>
        </div>

        {/* Agency + Set-aside */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {opp.agency && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
              {opp.agency}
            </span>
          )}
          {opp.set_aside && (
            <span className="rounded bg-[#00E5FA]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#00E5FA]">
              {opp.set_aside}
            </span>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex items-center justify-between">
          {/* Ceiling */}
          <div>
            <p className="text-[10px] text-slate-500">Value</p>
            <p className="text-sm font-semibold text-white">
              {formatCeiling(opp.ceiling)}
            </p>
          </div>

          {/* pWin */}
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Win Prob</p>
            <p className={`text-sm font-semibold ${pwinColor}`}>
              {opp.pwin ?? 0}%
            </p>
          </div>
        </div>

        {/* Due date */}
        {opp.due_date && (
          <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
            <span className="text-[10px] text-slate-500">Due</span>
            <span className="text-[10px] text-slate-400">
              {formatDate(opp.due_date)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

function formatCeiling(value: number | null | undefined): string {
  if (!value) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
