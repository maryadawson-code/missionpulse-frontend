// filepath: lib/rbac/config.ts
// T-4: RBAC Config — Single source of truth for role permissions
// Source: roles_permissions_config.json v9.5
// DO NOT manually edit permission maps. Update the JSON, regenerate this file.

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------

/** Module IDs that match keys in roles_permissions_config.json → role.modules */
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
  | 'personnel'

/** Config role IDs — the 12 canonical roles from roles_permissions_config.json */
export type ConfigRoleId =
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

/** DB role strings that exist in profiles.role (legacy + config) */
export type DbRole =
  | ConfigRoleId
  | 'CEO'
  | 'COO'
  | 'CAP'
  | 'PM'
  | 'SA'
  | 'FIN'
  | 'CON'
  | 'DEL'
  | 'QA'
  | 'admin'
  | 'teaming_partner'
  | 'viewer'
  | 'Partner'

export type RoleType = 'internal' | 'external'

export type UIComplexityLevel = 'simplified' | 'standard' | 'advanced' | 'admin'

export interface ModulePermission {
  shouldRender: boolean
  canView: boolean
  canEdit: boolean
  scopeRestriction?: 'assigned_sections_only' | 'own_tasks_only' | 'assigned_documents_only'
}

export interface AIAgentPermissions {
  allowedAgents: string[]
  canTriggerBlackHat: boolean
  canViewReasoningCards: boolean
  canOverrideAIDecisions: boolean
}

export interface GateAuthority {
  canApprove: string[]
  canTriggerReview: boolean
  canOverrideGate: boolean
}

export interface SecurityConfig {
  forceCUIWatermark: boolean
  classificationCeiling: string
  canViewAllClassifications: boolean
  canExportCUI: boolean
  sessionTimeout: number
}

export interface RoleConfig {
  id: ConfigRoleId
  displayName: string
  shipleyFunction: string
  type: RoleType
  uiComplexityLevel: UIComplexityLevel
  autoRevokeOnSubmit?: boolean
  modules: Record<string, ModulePermission>
  aiAgents: AIAgentPermissions
  gateAuthority: GateAuthority
  security: SecurityConfig
}

// ---------------------------------------------------------------------------
// 2. DB Role → Config Role Alias Map
// ---------------------------------------------------------------------------
// The profiles.role column has legacy short codes (CEO, COO, etc.).
// The config uses descriptive IDs (executive, operations, etc.).
// This map normalises any DB string to a ConfigRoleId.

const ROLE_ALIAS_MAP: Record<string, ConfigRoleId> = {
  // Direct matches (config ID === DB value)
  executive: 'executive',
  operations: 'operations',
  capture_manager: 'capture_manager',
  proposal_manager: 'proposal_manager',
  volume_lead: 'volume_lead',
  pricing_manager: 'pricing_manager',
  contracts: 'contracts',
  hr_staffing: 'hr_staffing',
  author: 'author',
  partner: 'partner',
  subcontractor: 'subcontractor',
  consultant: 'consultant',

  // Legacy short codes → config IDs
  CEO: 'executive',
  COO: 'operations',
  CAP: 'capture_manager',
  PM: 'proposal_manager',
  SA: 'volume_lead',
  FIN: 'pricing_manager',
  CON: 'contracts',
  DEL: 'hr_staffing',
  QA: 'contracts', // QA reviews compliance; contracts is closest fit
  admin: 'executive', // admin maps to full access
  teaming_partner: 'partner',
  Partner: 'partner',
  viewer: 'consultant', // read-only, time-limited — consultant is closest
}

/** Resolve any DB role string to a canonical ConfigRoleId. Falls back to 'consultant' (minimum access). */
export function resolveRole(dbRole: string | null | undefined): ConfigRoleId {
  if (!dbRole) return 'consultant'
  return ROLE_ALIAS_MAP[dbRole] ?? 'consultant'
}

// ---------------------------------------------------------------------------
// 3. Permissions Config (derived from roles_permissions_config.json v9.5)
// ---------------------------------------------------------------------------

const ROLE_CONFIGS: Record<ConfigRoleId, RoleConfig> = {
  executive: {
    id: 'executive',
    displayName: 'Executive / Admin',
    shipleyFunction: 'Executive Sponsor',
    type: 'internal',
    uiComplexityLevel: 'admin',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: true, canView: true, canEdit: true },
      integrations: { shouldRender: true, canView: true, canEdit: true },
      audit_log: { shouldRender: true, canView: true, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['capture', 'strategy', 'blackhat', 'writer', 'compliance', 'pricing', 'contracts', 'orals'],
      canTriggerBlackHat: true,
      canViewReasoningCards: true,
      canOverrideAIDecisions: true,
    },
    gateAuthority: { canApprove: ['gate1', 'gold', 'submit'], canTriggerReview: true, canOverrideGate: true },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-CTI//SP-PROPIN',
      canViewAllClassifications: true,
      canExportCUI: true,
      sessionTimeout: 28800,
    },
  },
  operations: {
    id: 'operations',
    displayName: 'Operations / COO',
    shipleyFunction: 'Capture Executive',
    type: 'internal',
    uiComplexityLevel: 'advanced',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: true },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: true, canView: true, canEdit: false },
      audit_log: { shouldRender: true, canView: true, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['capture', 'strategy', 'blackhat', 'writer', 'compliance', 'pricing'],
      canTriggerBlackHat: true,
      canViewReasoningCards: true,
      canOverrideAIDecisions: true,
    },
    gateAuthority: { canApprove: ['gate1', 'blue', 'red'], canTriggerReview: true, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-CTI//SP-PROPIN',
      canViewAllClassifications: true,
      canExportCUI: true,
      sessionTimeout: 28800,
    },
  },
  capture_manager: {
    id: 'capture_manager',
    displayName: 'Capture Manager',
    shipleyFunction: 'Capture Manager',
    type: 'internal',
    uiComplexityLevel: 'advanced',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['capture', 'strategy', 'blackhat', 'writer', 'compliance'],
      canTriggerBlackHat: true,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: ['gate1', 'blue'], canTriggerReview: true, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-CTI',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  proposal_manager: {
    id: 'proposal_manager',
    displayName: 'Proposal Manager',
    shipleyFunction: 'Proposal Manager',
    type: 'internal',
    uiComplexityLevel: 'advanced',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: true },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer', 'compliance', 'pricing'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: true, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-PROPIN',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  volume_lead: {
    id: 'volume_lead',
    displayName: 'Volume Lead',
    shipleyFunction: 'Volume Lead',
    type: 'internal',
    uiComplexityLevel: 'standard',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer', 'compliance'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-CTI',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  pricing_manager: {
    id: 'pricing_manager',
    displayName: 'Pricing / Cost Volume Lead',
    shipleyFunction: 'Pricing Manager',
    type: 'internal',
    uiComplexityLevel: 'standard',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: true, canView: true, canEdit: true },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['pricing', 'compliance'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: true,
      classificationCeiling: 'CUI//SP-PROPIN',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  contracts: {
    id: 'contracts',
    displayName: 'Contracts / Compliance',
    shipleyFunction: 'Contracts Manager',
    type: 'internal',
    uiComplexityLevel: 'standard',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: true },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['compliance', 'contracts'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-PROCURE',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  hr_staffing: {
    id: 'hr_staffing',
    displayName: 'HR / Staffing',
    shipleyFunction: 'Resource Manager',
    type: 'internal',
    uiComplexityLevel: 'simplified',
    modules: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
      personnel: { shouldRender: true, canView: true, canEdit: true },
    },
    aiAgents: {
      allowedAgents: ['writer'],
      canTriggerBlackHat: false,
      canViewReasoningCards: false,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: true,
      classificationCeiling: 'CUI//SP-PRVCY',
      canViewAllClassifications: false,
      canExportCUI: false,
      sessionTimeout: 7200,
    },
  },
  author: {
    id: 'author',
    displayName: 'Author / SME',
    shipleyFunction: 'Section Author',
    type: 'internal',
    uiComplexityLevel: 'simplified',
    modules: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer', 'compliance'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: false,
      classificationCeiling: 'CUI//SP-CTI',
      canViewAllClassifications: false,
      canExportCUI: true,
      sessionTimeout: 14400,
    },
  },
  partner: {
    id: 'partner',
    displayName: 'Teaming Partner',
    shipleyFunction: 'Teaming Partner',
    type: 'external',
    uiComplexityLevel: 'simplified',
    autoRevokeOnSubmit: true,
    modules: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true, scopeRestriction: 'assigned_sections_only' },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false, scopeRestriction: 'own_tasks_only' },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true, scopeRestriction: 'assigned_documents_only' },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer'],
      canTriggerBlackHat: false,
      canViewReasoningCards: false,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: true,
      classificationCeiling: 'PUBLIC',
      canViewAllClassifications: false,
      canExportCUI: false,
      sessionTimeout: 3600,
    },
  },
  subcontractor: {
    id: 'subcontractor',
    displayName: 'Subcontractor',
    shipleyFunction: 'Subcontractor',
    type: 'external',
    uiComplexityLevel: 'simplified',
    autoRevokeOnSubmit: true,
    modules: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true, scopeRestriction: 'assigned_sections_only' },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false, scopeRestriction: 'own_tasks_only' },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true, scopeRestriction: 'assigned_documents_only' },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer'],
      canTriggerBlackHat: false,
      canViewReasoningCards: false,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: true,
      classificationCeiling: 'PUBLIC',
      canViewAllClassifications: false,
      canExportCUI: false,
      sessionTimeout: 3600,
    },
  },
  consultant: {
    id: 'consultant',
    displayName: 'Consultant / SME',
    shipleyFunction: 'Subject Matter Expert',
    type: 'external',
    uiComplexityLevel: 'simplified',
    autoRevokeOnSubmit: true,
    modules: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: false },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    aiAgents: {
      allowedAgents: ['writer', 'capture'],
      canTriggerBlackHat: false,
      canViewReasoningCards: true,
      canOverrideAIDecisions: false,
    },
    gateAuthority: { canApprove: [], canTriggerReview: false, canOverrideGate: false },
    security: {
      forceCUIWatermark: true,
      classificationCeiling: 'CUI//SP-CTI',
      canViewAllClassifications: false,
      canExportCUI: false,
      sessionTimeout: 3600,
    },
  },
}

// ---------------------------------------------------------------------------
// 4. Accessors
// ---------------------------------------------------------------------------

/** Get full role config for a resolved ConfigRoleId */
export function getRoleConfig(roleId: ConfigRoleId): RoleConfig {
  return ROLE_CONFIGS[roleId]
}

/** Get module permission for a given DB role + module */
export function getModulePermission(
  dbRole: string | null | undefined,
  moduleId: ModuleId
): ModulePermission {
  const configRole = resolveRole(dbRole)
  const config = ROLE_CONFIGS[configRole]
  const mod = config.modules[moduleId]
  // Fail closed: if module not defined for this role, deny everything
  return mod ?? { shouldRender: false, canView: false, canEdit: false }
}

/** Check if a DB role is internal */
export function isInternalRole(dbRole: string | null | undefined): boolean {
  const config = getRoleConfig(resolveRole(dbRole))
  return config.type === 'internal'
}

/** Get UI complexity level for a DB role */
export function getUIComplexityLevel(dbRole: string | null | undefined): UIComplexityLevel {
  return getRoleConfig(resolveRole(dbRole)).uiComplexityLevel
}

/** Get the nav items this role should see (from navigationConfig) */
export interface NavItem {
  id: ModuleId
  label: string
  icon: string
  route: string
  badge?: string
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
  { id: 'pipeline', label: 'Pipeline', icon: 'TrendingUp', route: '/pipeline' },
  { id: 'proposals', label: 'Proposals', icon: 'FileText', route: '/proposals' },
  { id: 'workflow_board', label: 'Workflow', icon: 'Kanban', route: '/workflow' },
  { id: 'ai_chat', label: 'AI Assistant', icon: 'MessageSquare', route: '/chat' },
  { id: 'documents', label: 'Documents', icon: 'FolderOpen', route: '/documents' },
]

const SECONDARY_NAV: NavItem[] = [
  { id: 'strategy', label: 'Strategy', icon: 'Target', route: '/strategy' },
  { id: 'blackhat', label: 'Black Hat', icon: 'Swords', route: '/blackhat', badge: 'Private' },
  { id: 'pricing', label: 'Pricing', icon: 'DollarSign', route: '/pricing', badge: 'CUI' },
  { id: 'compliance', label: 'Compliance', icon: 'Scale', route: '/compliance' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', route: '/analytics' },
]

const ADMIN_NAV: NavItem[] = [
  { id: 'admin', label: 'Admin', icon: 'Settings', route: '/admin' },
  { id: 'integrations', label: 'Integrations', icon: 'Link', route: '/integrations' },
  { id: 'audit_log', label: 'Audit Log', icon: 'History', route: '/audit' },
]

/** Returns only the nav items this role's shouldRender === true. Invisible RBAC. */
export function getVisibleNav(dbRole: string | null | undefined): {
  primary: NavItem[]
  secondary: NavItem[]
  admin: NavItem[]
} {
  const configRole = resolveRole(dbRole)
  const config = ROLE_CONFIGS[configRole]

  const filter = (items: NavItem[]) =>
    items.filter((item) => config.modules[item.id]?.shouldRender === true)

  return {
    primary: filter(PRIMARY_NAV),
    secondary: filter(SECONDARY_NAV),
    admin: filter(ADMIN_NAV),
  }
}
