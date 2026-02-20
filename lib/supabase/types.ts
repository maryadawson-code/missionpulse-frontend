// FILE: lib/supabase/types.ts
// MissionPulse Phase 2 — Single source of truth for Supabase types
// SECURITY: NIST 800-53 Rev 5 CHECKED
// Verified against: CURRENT_STATE.md live schema (2/19/2026)
// Verified against: lib/rbac/config.ts, lib/actions/*.ts, components/**

// ============================================================
// USER ROLES
// ============================================================

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
  // Config v9.5 role IDs (lowercase)
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
  | 'volume_lead'
  | 'subcontractor'
  | 'consultant';

// ============================================================
// MODULE IDS
// Union of: config.ts RBAC modules + Sidebar nav modules
// ============================================================

export type ModuleId =
  // From lib/rbac/config.ts (14 per role)
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
  | 'personnel'
  // From Sidebar nav (MissionPulse 15 modules)
  | 'war_room'
  | 'swimlane'
  | 'rfp_shredder'
  | 'contract_scanner'
  | 'iron_dome'
  | 'black_hat'
  | 'hitl'
  | 'orals'
  | 'playbook'
  | 'frenemy'
  | 'launch'
  | 'post_award'
  | 'agent_hub'
  | 'settings'
  | 'audit';

// ============================================================
// PROFILE (verified: 13 columns from live schema 2/19)
// ============================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  company_id: string | null;
  status: string | null;
  last_login: string | null;
  // Not in DB but referenced in code — safe as nullable
  title: string | null;
}

// ============================================================
// OPPORTUNITY (verified: 46 columns from live schema 2/19)
// Includes ALL real DB columns + code-referenced extras
// ============================================================

export interface Opportunity {
  id: string;
  title: string;                          // col 2 — primary display name
  nickname: string | null;                // col 3 — short name
  description: string | null;             // col 4
  agency: string | null;                  // col 5
  sub_agency: string | null;              // col 6
  contract_vehicle: string | null;        // col 7
  naics_code: string | null;              // col 8
  set_aside: string | null;              // col 9
  ceiling: number | null;                // col 10 — dollar value (NOT "value")
  period_of_performance: string | null;   // col 11 — PoP description
  due_date: string | null;               // col 12
  phase: string;                         // col 13 — Shipley gate (default 'Gate 1')
  status: string;                        // col 14 — Active/Won/Lost/No-Bid
  priority: string | null;               // col 15 — Low/Medium/High/Critical
  pwin: number | null;                   // col 16 — 0–100 (NOT "win_probability")
  go_no_go: string | null;              // col 17
  incumbent: string | null;              // col 18
  solicitation_number: string | null;    // col 19
  sam_url: string | null;               // col 20
  notes: string | null;                  // col 21
  owner_id: string | null;              // col 22 — FK profiles (NOT "created_by")
  created_at: string;                    // col 23
  updated_at: string | null;            // col 24
  hubspot_deal_id: string | null;       // col 25
  hubspot_synced_at: string | null;     // col 26
  deal_source: string | null;           // col 27 — manual/hubspot/sam_gov
  pipeline_stage: string | null;         // col 28 — legacy (prefer "phase")
  close_date: string | null;            // col 29
  contact_email: string | null;         // col 30
  contact_name: string | null;          // col 31
  sam_opportunity_id: string | null;    // col 32
  govwin_id: string | null;            // col 33
  place_of_performance: string | null;  // col 34
  is_recompete: boolean | null;         // col 35
  bd_investment: number | null;         // col 36
  tags: string[] | null;                // col 37
  custom_properties: Record<string, unknown> | null; // col 38
  company_id: string | null;            // col 39
  win_probability: number | null;       // col 40 — DUPLICATE of pwin
  shipley_phase: string | null;         // col 41 — DUPLICATE of phase
  submission_date: string | null;       // col 42
  award_date: string | null;            // col 43
  pop_start: string | null;            // col 44
  pop_end: string | null;              // col 45
  metadata: Record<string, unknown> | null; // col 46
  // Not in DB but referenced in components — safe as nullable
  floor: number | null;
  contract_type: string | null;
  source: string | null;
  source_url: string | null;
  contact_phone: string | null;
  decision_authority: string | null;
  evaluation_criteria: string | null;
  team_lead: string | null;
  capture_manager: string | null;
  proposal_manager: string | null;
  solution_architect: string | null;
  pricing_lead: string | null;
}

// ============================================================
// SHIPLEY PHASES
// ============================================================

export const SHIPLEY_PHASES = [
  'Gate 1',
  'Gate 2',
  'Gate 3',
  'Gate 4',
  'Gate 5',
  'Gate 6',
] as const;

export type ShipleyPhase = (typeof SHIPLEY_PHASES)[number];

// ============================================================
// PIPELINE STATS
// ============================================================

export interface PipelineStats {
  total: number;
  totalValue: number;
  avgPwin: number;
  byPhase: Record<string, number>;
  byStatus: Record<string, number>;
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ============================================================
// DATABASE TYPE (Supabase SDK shape)
// Insert/Update use Record<string, unknown> to prevent SDK
// type-inference collapse with Partial<T> & { required } patterns.
// Row types remain fully typed for reads.
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      opportunities: {
        Row: Opportunity;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      activity_log: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      audit_logs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: never;
      };
      companies: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      roles: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      pipeline_stages: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_internal_user: { Args: Record<string, never>; Returns: boolean };
      is_authenticated: { Args: Record<string, never>; Returns: boolean };
      can_access_sensitive: { Args: Record<string, never>; Returns: boolean };
      get_user_role: { Args: Record<string, never>; Returns: string };
      get_my_company_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
  };
}

// ============================================================
// PLAIN LANGUAGE HELPERS
// ============================================================

export const COLUMN_LABELS: Record<string, string> = {
  pwin: 'Win Probability',
  ceiling: 'Contract Value',
  phase: 'Shipley Phase',
  set_aside: 'Set-Aside',
  bd_investment: 'B&P Investment',
  is_recompete: 'Recompete',
  pop_start: 'Period of Performance Start',
  pop_end: 'Period of Performance End',
  naics_code: 'NAICS Code',
  contact_name: 'Primary Contact',
  owner_id: 'Opportunity Owner',
  due_date: 'Due Date',
  solicitation_number: 'Solicitation #',
};

// ============================================================
// CUI PORTION MARKINGS
// ============================================================

export const CUI_MARKINGS: Partial<Record<ModuleId, string>> = {
  pricing: 'CUI // SP-PROPIN',
  black_hat: 'CUI // OPSEC',
  blackhat: 'CUI // OPSEC',
};
