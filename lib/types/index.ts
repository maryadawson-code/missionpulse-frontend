// filepath: lib/types/index.ts

import type { Database } from '@/lib/supabase/database.types'

// ─── Base Row Types ─────────────────────────────────────────────
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type Company = Database['public']['Tables']['companies']['Row']

export type OpportunityAssignment = Database['public']['Tables']['opportunity_assignments']['Row']

export type RfpDocument = Database['public']['Tables']['rfp_documents']['Row']
export type RfpDocumentInsert = Database['public']['Tables']['rfp_documents']['Insert']

export type ComplianceRequirement = Database['public']['Tables']['compliance_requirements']['Row']
export type ComplianceRequirementInsert = Database['public']['Tables']['compliance_requirements']['Insert']
export type ComplianceRequirementUpdate = Database['public']['Tables']['compliance_requirements']['Update']

export type ComplianceItem = Database['public']['Tables']['compliance_items']['Row']

export type PlaybookEntry = Database['public']['Tables']['playbook_entries']['Row']
export type PlaybookEntryInsert = Database['public']['Tables']['playbook_entries']['Insert']
export type OpportunityComment = Database['public']['Tables']['opportunity_comments']['Row']
export type OpportunityCommentInsert = Database['public']['Tables']['opportunity_comments']['Insert']

// ─── Derived Display Types ──────────────────────────────────────
// Use these in components that only need a subset of fields.
// NEVER alias field names — these are Pick types, not transforms.

export type OpportunityCardFields = Pick<
  Opportunity,
  | 'id'
  | 'title'
  | 'agency'
  | 'ceiling'
  | 'pwin'
  | 'phase'
  | 'status'
  | 'due_date'
  | 'set_aside'
  | 'owner_id'
>

export type OpportunityPipelineRow = Pick<
  Opportunity,
  | 'id'
  | 'title'
  | 'agency'
  | 'ceiling'
  | 'pwin'
  | 'phase'
  | 'status'
  | 'due_date'
  | 'submission_date'
  | 'set_aside'
  | 'owner_id'
  | 'priority'
  | 'contract_vehicle'
  | 'naics_code'
>

export type ProfileMinimal = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'role' | 'avatar_url'
>

// ─── RBAC Types ─────────────────────────────────────────────────
export type RBACRole =
  | 'executive'
  | 'operations'
  | 'capture_manager'
  | 'proposal_manager'
  | 'volume_lead'
  | 'pricing_manager'
  | 'contracts'
  | 'hr_staffing'
  | 'author'
  | 'partner'
  | 'subcontractor'
  | 'consultant'

export type RBACModule =
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

export interface ModulePermission {
  shouldRender: boolean
  canView: boolean
  canEdit: boolean
  scopeRestriction?: string
}

// ─── Dashboard KPI Types ────────────────────────────────────────
export interface DashboardStats {
  totalOpportunities: number
  totalPipelineValue: number
  averagePwin: number
  upcomingDeadlines: number
  byPhase: Record<string, number>
  byStatus: Record<string, number>
}

// ─── Server Action Response ─────────────────────────────────────
export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}
