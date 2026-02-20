/**
 * MissionPulse Database Types
 * Verified against live information_schema 2026-02-19
 * © 2026 Mission Meets Tech
 */

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

/** Maps DB roles to RBAC config roles */
export const ROLE_TO_CONFIG: Record<UserRole, string> = {
  CEO: 'executive',
  COO: 'operations',
  CAP: 'capture_manager',
  PM: 'proposal_manager',
  SA: 'solution_architect',
  FIN: 'pricing_lead',
  CON: 'contracts_lead',
  DEL: 'delivery_lead',
  QA: 'quality_lead',
  Partner: 'partner',
  Admin: 'executive',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole | null
  company: string | null
  phone: string | null
  avatar_url: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
  company_id: string | null
  status: string | null
  last_login: string | null
}

export interface Opportunity {
  id: string
  title: string
  agency: string | null
  sub_agency: string | null
  description: string | null
  solicitation_number: string | null
  naics_code: string | null
  set_aside: string | null
  ceiling: number | null
  contract_type: string | null
  due_date: string | null
  source: string | null
  source_url: string | null
  phase: string
  status: string
  priority: string | null
  pwin: number | null
  owner_id: string | null
  company_id: string | null
  created_at: string
  updated_at: string
  capture_manager_id: string | null
  proposal_manager_id: string | null
  bd_investment: number | null
  is_recompete: boolean | null
  incumbent: string | null
  contact_name: string | null
  pipeline_stage: string | null
  contact_email: string | null
  contact_phone: string | null
  evaluation_criteria: unknown | null
  win_themes: unknown | null
  ghost_strategies: unknown | null
  discriminators: unknown | null
  team_members: unknown | null
  competitors: unknown | null
  notes: string | null
  tags: string[] | null
  custom_properties: Record<string, unknown> | null
  risk_level: string | null
  win_probability: number | null
  shipley_phase: string | null
  submission_date: string | null
  award_date: string | null
  pop_start: string | null
  pop_end: string | null
  metadata: Record<string, unknown>
}

export interface Company {
  id: string
  name: string
  duns_number: string | null
  cage_code: string | null
  uei: string | null
  sam_status: string | null
  naics_codes: string[] | null
  set_aside_types: string[] | null
  created_at: string
  updated_at: string
  logo_url: string | null
  website: string | null
  subscription_tier: string | null
  subscription_status: string | null
  stripe_customer_id: string | null
  max_users: number | null
}

export interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
  is_internal: boolean
}

export interface PipelineStage {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  gate_number: number | null
  color: string | null
  created_at: string
  updated_at: string
}

/** Supabase Database interface for typed client */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
      }
      opportunities: {
        Row: Opportunity
        Insert: Partial<Opportunity> & { title: string }
        Update: Partial<Opportunity>
      }
      companies: {
        Row: Company
        Insert: Partial<Company> & { name: string }
        Update: Partial<Company>
      }
      roles: {
        Row: Role
        Insert: Partial<Role> & { name: string }
        Update: Partial<Role>
      }
      pipeline_stages: {
        Row: PipelineStage
        Insert: Partial<PipelineStage> & { name: string }
        Update: Partial<PipelineStage>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_internal_user: { Args: Record<string, never>; Returns: boolean }
      is_authenticated: { Args: Record<string, never>; Returns: boolean }
      can_access_sensitive: { Args: Record<string, never>; Returns: boolean }
      get_user_role: { Args: Record<string, never>; Returns: string }
      get_my_company_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: Record<string, never>
  }
}

/** Module IDs matching roles_permissions_config.json */
export type ModuleId =
  | 'dashboard'
  | 'pipeline'
  | 'proposals'
  | 'pricing'
  | 'strategy'
  | 'blackhat'
  | 'compliance'
  | 'workflow_board'
  | 'ai_chat'
  | 'documents'
  | 'analytics'
  | 'admin'
  | 'integrations'
  | 'audit_log'

/** CUI portion markings */
export const CUI_MARKINGS: Partial<Record<ModuleId, string>> = {
  pricing: 'CUI // SP-PROPIN',
  blackhat: 'CUI // OPSEC',
}

/** Column display labels (plain language) */
export const COLUMN_LABELS: Record<string, string> = {
  pwin: 'Win Probability',
  ceiling: 'Contract Value',
  phase: 'Shipley Phase',
  set_aside: 'Set-Aside',
  bd_investment: 'B&P Investment',
  is_recompete: 'Recompete',
  pop_start: 'Performance Start',
  pop_end: 'Performance End',
  due_date: 'Due Date',
  naics_code: 'NAICS Code',
  solicitation_number: 'Solicitation #',
}
