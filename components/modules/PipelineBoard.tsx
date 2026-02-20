'use client'

/**
 * PipelineBoard — Kanban board with drag-and-drop
 * Columns = Shipley gates (active pipeline stages)
 * © 2026 Mission Meets Tech
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOpportunityPhase } from '@/lib/actions/opportunities'
import { ACTIVE_STAGES } from '@/lib/utils/constants'
import OpportunityCard from '@/components/modules/OpportunityCard'
import type { Opportunity } from '@/lib/supabase/types'

interface Props {
  initialData: Record<string, Opportunity[]>
}

export default function PipelineBoard({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [draggedOpp, setDraggedOpp] = useState<Opportunity | null>(null)
  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null)
  const router = useRouter()

  const handleDragStart = (opp: Opportunity) => {
    setDraggedOpp(opp)
  }

  const handleDragOver = (e: React.DragEvent, phase: string) => {
    e.preventDefault()
    setDragOverPhase(phase)
  }

  const handleDragLeave = () => {
    setDragOverPhase(null)
  }

  const handleDrop = async (targetPhase: string) => {
    if (!draggedOpp || draggedOpp.phase === targetPhase) {
      setDraggedOpp(null)
      setDragOverPhase(null)
      return
    }

    const sourcePhase = draggedOpp.phase || 'Unknown'

    // Optimistic update
    setData((prev) => {
      const next = { ...prev }
      // Remove from source
      next[sourcePhase] = (next[sourcePhase] || []).filter((o) => o.id !== draggedOpp.id)
      // Add to target
      if (!next[targetPhase]) next[targetPhase] = []
      next[targetPhase] = [...next[targetPhase], { ...draggedOpp, phase: targetPhase }]
      return next
    })

    setDraggedOpp(null)
    setDragOverPhase(null)

    // Persist
    const result = await updateOpportunityPhase(draggedOpp.id, targetPhase)
    if (result.error) {
      // Revert on failure
      router.refresh()
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ACTIVE_STAGES.map((stage) => {
        const opps = data[stage.name] || []
        const isOver = dragOverPhase === stage.name

        return (
          <div
            key={stage.name}
            className={`flex w-72 flex-shrink-0 flex-col rounded-xl border transition-colors ${
              isOver
                ? 'border-[#00E5FA]/50 bg-[#00E5FA]/5'
                : 'border-white/10 bg-[#000A1A]'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage.name)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: '#00E5FA' }}
                />
                <span className="text-sm font-semibold text-white">{stage.name}</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {opps.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 p-3">
              {opps.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-600">
                  No opportunities
                </p>
              )}
              {opps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onDragStart={() => handleDragStart(opp)}
                />
              ))}
            </div>

            {/* Column Footer */}
            <div className="border-t border-white/10 px-4 py-2">
              <p className="text-xs text-slate-500">
                {formatColumnValue(opps)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatColumnValue(opps: Opportunity[]): string {
  const total = opps.reduce((sum, o) => sum + (o.ceiling || 0), 0)
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M total`
  if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K total`
  if (total > 0) return `$${total} total`
  return 'Empty'
}
