/**
 * MissionPulse Application Types
 * Derived from Supabase-generated database.types.ts
 * © 2026 Mission Meets Tech
 */
import type { Database } from './database.types'

// ── Re-export Database for any module that needs it ──
export type { Database }

// ── Table Row Types ──
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']

// ── RBAC Types ──
export type UserRole =
  | 'CEO'
  | 'COO'
  | 'CAP'
  | 'PM'
  | 'SA'
  | 'FIN'
  | 'CON'
  | 'DEL'
  | 'QA'
  | 'Partner'
  | 'Admin'
  | 'executive'
  | 'operations'
  | 'capture_manager'
  | 'proposal_manager'
  | 'solution_architect'
  | 'pricing_lead'
  | 'contracts_lead'
  | 'delivery_lead'
  | 'quality_lead'
  | 'author'
  | 'partner'
  | 'viewer'
  | 'admin'

export type ModuleId =
  | 'dashboard'
  | 'pipeline'
  | 'war_room'
  | 'swimlane'
  | 'rfp_shredder'
  | 'contract_scanner'
  | 'iron_dome'
  | 'black_hat'
  | 'blackhat'
  | 'pricing'
  | 'hitl'
  | 'orals'
  | 'playbook'
  | 'frenemy'
  | 'launch'
  | 'post_award'
  | 'agent_hub'
  | 'compliance'
  | 'proposals'
  | 'strategy'
  | 'workflow_board'
  | 'ai_chat'
  | 'documents'
  | 'analytics'
  | 'integrations'
  | 'audit_log'
  | 'personnel'
  | 'admin'
  | 'settings'

// ── Shipley Phases ──
export const SHIPLEY_PHASES = [
  'Gate 1',
  'Gate 2',
  'Gate 3',
  'Gate 4',
  'Gate 5',
  'Submitted',
  'Won',
  'Lost',
  'No-Bid',
] as const

export type ShipleyPhase = (typeof SHIPLEY_PHASES)[number]

// ── Pipeline Analytics ──
export interface PipelineStats {
  total: number
  totalValue: number
  avgPwin: number
  byPhase: Record<string, number>
  byStatus: Record<string, number>
}

// ── Plain-Language Column Labels (UX v8.0) ──
export const COLUMN_LABELS: Record<string, string> = {
  title: 'Opportunity Name',
  agency: 'Agency',
  ceiling: 'Contract Value',
  pwin: 'Win Probability',
  phase: 'Pipeline Phase',
  status: 'Status',
  priority: 'Priority',
  due_date: 'Due Date',
  naics: 'NAICS Code',
  set_aside: 'Set-Aside',
  contract_type: 'Contract Type',
  contact_name: 'Primary Contact',
  contact_email: 'Contact Email',
  owner_id: 'Capture Lead',
  description: 'Description',
  solicitation_number: 'Solicitation #',
  place_of_performance: 'Place of Performance',
  pop_start: 'Period of Performance Start',
  pop_end: 'Period of Performance End',
  submission_date: 'Submission Date',
  award_date: 'Award Date',
  created_at: 'Created',
  updated_at: 'Last Modified',
}
