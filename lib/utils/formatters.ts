// filepath: lib/utils/formatters.ts

/**
 * Format a number as USD currency.
 * Returns "—" for null/undefined values.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as compact currency (e.g., $1.2M, $500K).
 * Returns "—" for null/undefined values.
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format pWin (0-100 integer) as a percentage string.
 * Returns "—" for null/undefined values.
 */
export function formatPwin(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value}%`
}

/**
 * Format an ISO date string to a localized short date.
 * Returns "—" for null/undefined values.
 */
export function formatDate(value: string | null | undefined): string {
  if (value == null) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

/**
 * Format an ISO date string to relative time (e.g., "3 days ago", "in 2 weeks").
 * Returns "—" for null/undefined values.
 */
export function formatRelativeDate(value: string | null | undefined): string {
  if (value == null) return '—'
  const now = Date.now()
  const target = new Date(value).getTime()
  const diffMs = target - now
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays <= 30) return `in ${diffDays} days`
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`

  return formatDate(value)
}

/**
 * Get a color class for pWin value (green/yellow/red scale).
 */
export function pwinColor(value: number | null | undefined): string {
  if (value == null) return 'text-gray-400'
  if (value >= 70) return 'text-emerald-400'
  if (value >= 40) return 'text-amber-400'
  return 'text-red-400'
}

/**
 * Get a color class for Shipley phase badge.
 */
export function phaseColor(phase: string | null | undefined): string {
  if (phase == null) return 'bg-gray-700 text-gray-300'
  const p = phase.toLowerCase()
  if (p.includes('capture') || p.includes('long')) return 'bg-blue-900/50 text-blue-300 border border-blue-700'
  if (p.includes('proposal') || p.includes('mid')) return 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'
  if (p.includes('submit') || p.includes('final')) return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
  if (p.includes('post') || p.includes('award')) return 'bg-purple-900/50 text-purple-300 border border-purple-700'
  return 'bg-gray-800 text-gray-300 border border-gray-600'
}

/**
 * Get a color class for opportunity status badge.
 */
export function statusColor(status: string | null | undefined): string {
  if (status == null) return 'bg-gray-700 text-gray-300'
  const s = status.toLowerCase()
  if (s === 'active' || s === 'open') return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
  if (s === 'won') return 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'
  if (s === 'lost') return 'bg-red-900/50 text-red-300 border border-red-700'
  if (s === 'no-go' || s === 'no_go') return 'bg-gray-800 text-gray-400 border border-gray-600'
  if (s === 'submitted') return 'bg-amber-900/50 text-amber-300 border border-amber-700'
  return 'bg-gray-800 text-gray-300 border border-gray-600'
}
