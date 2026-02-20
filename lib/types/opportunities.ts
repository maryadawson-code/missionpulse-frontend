// filepath: lib/types/opportunities.ts
// Derived from Database['public']['Tables'] — zero `as any`
import type { Database } from '@/lib/supabase/types'

export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']

// KPI shape for dashboard cards
export interface DashboardKPIs {
  pipelineCount: number
  totalCeiling: number
  avgPwin: number
  upcomingDeadlines: number
}

// Valid Shipley phases (from DB default: 'Gate 1')
export const SHIPLEY_PHASES = [
  'Gate 1',
  'Gate 2',
  'Gate 3',
  'Gate 4',
  'Gate 5',
  'Gate 6',
] as const

export type ShipleyPhase = (typeof SHIPLEY_PHASES)[number]

// Valid statuses
export const OPPORTUNITY_STATUSES = [
  'Active',
  'Won',
  'Lost',
  'No-Bid',
] as const

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

// Valid priorities
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type Priority = (typeof PRIORITIES)[number]

// Valid set-asides
export const SET_ASIDES = [
  'SDVOSB',
  'WOSB',
  '8(a)',
  'HUBZone',
  'Small Business',
  'Full & Open',
  'Other',
] as const

// Sorting config for pipeline table
export type SortField = 'title' | 'agency' | 'ceiling' | 'pwin' | 'phase' | 'due_date'
export type SortDirection = 'asc' | 'desc'

export interface PipelineFilters {
  phase: string | null
  status: string | null
  setAside: string | null
  search: string
}
