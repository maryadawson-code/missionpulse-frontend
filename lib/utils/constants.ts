/**
 * MissionPulse Constants
 * Brand tokens, pipeline stages, formatting utilities
 * © 2026 Mission Meets Tech
 */

/** Brand color tokens */
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

/** Pipeline stages from DB (10 rows, sorted by sort_order) */
export const PIPELINE_STAGES = [
  { id: 'long_range', name: 'Long Range', gate: 0, sort: 1, active: true },
  { id: 'gate_1', name: 'Gate 1: Qualify', gate: 1, sort: 2, active: true },
  { id: 'gate_2', name: 'Gate 2: Capture', gate: 2, sort: 3, active: true },
  { id: 'gate_3', name: 'Gate 3: Proposal', gate: 3, sort: 4, active: true },
  { id: 'blue_team', name: 'Blue Team Review', gate: 4, sort: 5, active: true },
  { id: 'red_team', name: 'Red Team Review', gate: 5, sort: 6, active: true },
  { id: 'gold_team', name: 'Gold Team / Final', gate: 6, sort: 7, active: true },
  { id: 'submitted', name: 'Submitted', gate: null, sort: 8, active: false },
  { id: 'won', name: 'Won', gate: null, sort: 9, active: false },
  { id: 'lost', name: 'Lost / No-Bid', gate: null, sort: 10, active: false },
] as const

export const ACTIVE_STAGES = PIPELINE_STAGES.filter((s) => s.active)
export const CLOSED_STAGES = PIPELINE_STAGES.filter((s) => !s.active)

/** Map phase string → stage object */
export const STAGE_MAP = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.name, s])
) as Record<string, (typeof PIPELINE_STAGES)[number]>

/** Map gate number → valid phases for that gate */
export const GATE_TO_STAGES: Record<number, string[]> = {
  0: ['Long Range'],
  1: ['Gate 1: Qualify'],
  2: ['Gate 2: Capture'],
  3: ['Gate 3: Proposal'],
  4: ['Blue Team Review'],
  5: ['Red Team Review'],
  6: ['Gold Team / Final'],
}

/** Format ceiling as currency */
export function formatCeiling(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  if (cents >= 1_000_000_000) return `$${(cents / 1_000_000_000).toFixed(1)}B`
  if (cents >= 1_000_000) return `$${(cents / 1_000_000).toFixed(0)}M`
  if (cents >= 1_000) return `$${(cents / 1_000).toFixed(0)}K`
  return `$${cents.toLocaleString()}`
}

/** Format pWin as colored percentage */
export function formatPwin(pwin: number | null): {
  text: string
  color: string
} {
  if (pwin === null) return { text: '—', color: BRAND.slate }
  if (pwin >= 70) return { text: `${pwin}%`, color: BRAND.success }
  if (pwin >= 40) return { text: `${pwin}%`, color: BRAND.warning }
  return { text: `${pwin}%`, color: BRAND.error }
}
