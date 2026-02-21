// filepath: lib/utils/constants.ts

/**
 * MissionPulse brand tokens — matches tailwind.config.ts extensions.
 * These are for JS-side reference; CSS usage goes through Tailwind classes.
 */
export const BRAND = {
  navy: '#00050F',
  cyan: '#00E5FA',
  white: '#FFFFFF',
  slate: '#94A3B8',
  surface: '#0F172A',
  border: '#1E293B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
} as const

/**
 * Shipley phase display config
 */
export const SHIPLEY_PHASE_CONFIG = [
  { key: 'Gate 1', label: 'Long-Range Pursuit', color: 'slate' },
  { key: 'Gate 2', label: 'Opportunity Assessment', color: 'slate' },
  { key: 'Gate 3', label: 'Capture Planning', color: 'amber' },
  { key: 'Gate 4', label: 'Proposal Development', color: 'amber' },
  { key: 'Gate 5', label: 'Post-Submission', color: 'emerald' },
  { key: 'Gate 6', label: 'Post-Award', color: 'emerald' },
] as const

/**
 * Active pipeline stages for the Kanban board.
 * These are the Shipley gates where opportunities are actively worked.
 * Terminal states (Won, Lost, No-Bid) are excluded.
 */
export const ACTIVE_STAGES = [
  { name: 'Gate 1', label: 'Long-Range Pursuit' },
  { name: 'Gate 2', label: 'Opportunity Assessment' },
  { name: 'Gate 3', label: 'Capture Planning' },
  { name: 'Gate 4', label: 'Proposal Development' },
  { name: 'Gate 5', label: 'Post-Submission' },
  { name: 'Gate 6', label: 'Post-Award' },
] as const

/**
 * Format a number as compact USD currency.
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

/**
 * Plain language labels for DB columns.
 * Maps database column names → human-readable display labels.
 */
export const COLUMN_LABELS: Record<string, string> = {
  pwin: 'Win Probability',
  ceiling: 'Contract Value',
  phase: 'Shipley Phase',
  set_aside: 'Set-Aside',
  bd_investment: 'B&P Investment',
  is_recompete: 'Recompete',
  pop_start: 'Period of Performance Start',
  pop_end: 'Period of Performance End',
  due_date: 'Proposal Due Date',
  owner_id: 'Owner',
  contact_name: 'Primary Contact',
  contact_email: 'Contact Email',
  naics_code: 'NAICS Code',
  solicitation_number: 'Solicitation Number',
  contract_vehicle: 'Contract Vehicle',
  period_of_performance: 'Period of Performance',
  place_of_performance: 'Place of Performance',
  go_no_go: 'Go/No-Go Decision',
}
