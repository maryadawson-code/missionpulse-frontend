'use client'

import Link from 'next/link'
import type { Opportunity } from '@/lib/types'

type OpportunityCardData = Pick<
  Opportunity,
  'id' | 'title' | 'agency' | 'ceiling' | 'pwin' | 'due_date'
>

interface OpportunityCardProps {
  opportunity: OpportunityCardData
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function pwinColor(pwin: number | null): string {
  const v = pwin ?? 50
  if (v >= 70) return 'text-emerald-400'
  if (v >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { id, title, agency, ceiling, pwin, due_date } = opportunity

  return (
    <Link
      href={`/war-room/${id}`}
      className="block rounded-lg border border-border bg-background p-3 shadow-sm hover:border-primary/50 transition-colors"
    >
      <p className="text-sm font-medium text-foreground truncate">{title}</p>
      {agency && (
        <p className="mt-1 text-xs text-muted-foreground truncate">{agency}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">
          {formatCurrency(ceiling ? Number(ceiling) : null)}
        </span>
        <span className={`font-mono font-medium ${pwinColor(pwin)}`}>
          {pwin ?? 0}%
        </span>
      </div>
      {due_date && (
        <p className="mt-1 text-xs text-muted-foreground">
          Due {formatDate(due_date)}
        </p>
      )}
    </Link>
  )
}
