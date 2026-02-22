// filepath: lib/rbac/config.ts
// ─── RBAC Configuration Loader ──────────────────────────────────
// Source of truth: roles_permissions_config.json v9.5
// Exports every type and function that hooks.ts + RBACGate.tsx need.

import rbacConfig from '@/roles_permissions_config.json'

// ─── Types ──────────────────────────────────────────────────────

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

export interface ModulePermission {
  shouldRender: boolean
  canView: boolean
  canEdit: boolean
  scopeRestriction?: string
}

export interface NavItem {
  module: ModuleId
  label: string
  href: string
  iconPath: string
}

export interface RoleConfig {
  id: string
  displayName: string
  type: string
  uiComplexityLevel: string
  modules: Record<string, ModulePermission>
  [key: string]: unknown
}

interface RBACConfig {
  version: string
  roles: Record<string, RoleConfig>
  [key: string]: unknown
}

// ─── Config singleton ───────────────────────────────────────────

const config = rbacConfig as unknown as RBACConfig

const ALL_MODULES: ModuleId[] = [
  'dashboard', 'pipeline', 'proposals', 'pricing', 'strategy',
  'blackhat', 'compliance', 'workflow_board', 'ai_chat',
  'documents', 'analytics', 'admin', 'integrations', 'audit_log', 'personnel',
]

const DENY_ALL: ModulePermission = { shouldRender: false, canView: false, canEdit: false }

// ─── Nav items (matching Sidebar.tsx) ───────────────────────────

const NAV_ITEMS: NavItem[] = [
  { module: 'dashboard', label: 'Dashboard', href: '/', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { module: 'pipeline', label: 'Pipeline', href: '/pipeline', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { module: 'proposals', label: 'Proposals', href: '/proposals', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { module: 'pricing', label: 'Pricing', href: '/pricing', iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { module: 'strategy', label: 'Strategy', href: '/strategy', iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { module: 'blackhat', label: 'Black Hat', href: '/blackhat', iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { module: 'compliance', label: 'Compliance', href: '/compliance', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { module: 'personnel', label: 'Personnel', href: '/personnel', iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  { module: 'workflow_board', label: 'Workflow', href: '/workflow', iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { module: 'documents', label: 'Documents', href: '/documents', iconPath: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
  { module: 'ai_chat', label: 'AI Assistant', href: '/ai', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { module: 'analytics', label: 'Analytics', href: '/analytics', iconPath: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { module: 'admin', label: 'Admin', href: '/admin', iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { module: 'audit_log', label: 'Audit Log', href: '/audit', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

// ─── Functions ──────────────────────────────────────────────────

/** Map any DB role string to a valid ConfigRoleId. Defaults to 'partner' (most restrictive). */
export function resolveRole(dbRole: string | null | undefined): ConfigRoleId {
  if (!dbRole) return 'partner'
  const normalized = dbRole.toLowerCase().replace(/[\s-]/g, '_')
  if (config.roles[normalized]) return normalized as ConfigRoleId
  // Legacy mappings from Phase 1
  const legacyMap: Record<string, ConfigRoleId> = {
    ceo: 'executive', admin: 'executive', coo: 'operations',
    cap: 'capture_manager', pm: 'proposal_manager',
    sa: 'volume_lead', fin: 'pricing_manager',
    con: 'contracts', del: 'hr_staffing', qa: 'author',
  }
  return legacyMap[normalized] ?? 'partner'
}

/** Get permission triple for a specific role + module. */
export function getModulePermission(role: string, module: ModuleId): ModulePermission {
  const resolved = resolveRole(role)
  const roleConfig = config.roles[resolved]
  if (!roleConfig) return DENY_ALL
  return roleConfig.modules[module] ?? DENY_ALL
}

/** Get all module permissions for a role. */
export function getRolePermissions(role: string): Record<string, ModulePermission> {
  const resolved = resolveRole(role)
  const roleConfig = config.roles[resolved]
  if (!roleConfig) {
    const empty: Record<string, ModulePermission> = {}
    for (const m of ALL_MODULES) empty[m] = DENY_ALL
    return empty
  }
  return roleConfig.modules
}

/** Get full role config object. */
export function getRoleConfig(role: string): RoleConfig | null {
  const resolved = resolveRole(role)
  return config.roles[resolved] ?? null
}

/** Get nav items filtered by shouldRender for a given role. */
export function getVisibleNav(role: string): { primary: NavItem[]; secondary: NavItem[]; admin: NavItem[] } {
  const perms = getRolePermissions(role)
  const visible = NAV_ITEMS.filter((item) => perms[item.module]?.shouldRender === true)
  const adminModules: ModuleId[] = ["admin", "audit_log", "integrations"]
  const secondaryModules: ModuleId[] = ["analytics", "documents", "ai_chat"]
  return {
    primary: visible.filter((i) => !adminModules.includes(i.module) && !secondaryModules.includes(i.module)),
    secondary: visible.filter((i) => secondaryModules.includes(i.module)),
    admin: visible.filter((i) => adminModules.includes(i.module)),
  }
}
/** Check if a role is internal (vs external: partner, subcontractor, consultant). */
export function isInternalRole(role: string): boolean {
  const roleConfig = getRoleConfig(role)
  return roleConfig?.type === 'internal'
}

/** Check a specific permission. */
export function hasPermission(
  role: string,
  module: ModuleId,
  permission: 'shouldRender' | 'canView' | 'canEdit'
): boolean {
  return getModulePermission(role, module)[permission] === true
}

/** Get display name for a role. */
export function getRoleDisplayName(role: string): string {
  const roleConfig = getRoleConfig(role)
  return roleConfig?.displayName ?? role.replace(/_/g, ' ')
}

/** Get UI complexity level for a role. */
export function getUIComplexityLevel(role: string): string {
  const roleConfig = getRoleConfig(role)
  return roleConfig?.uiComplexityLevel ?? 'simplified'
}

/** Get allowed AI agents for a role. Returns empty array if role has no agents. */
export function getAllowedAgents(role: string): string[] {
  const roleConfig = getRoleConfig(role)
  if (!roleConfig) return []
  const aiAgents = roleConfig.aiAgents as { allowedAgents?: string[] } | undefined
  return aiAgents?.allowedAgents ?? []
}

/** Check if a role has forceCUIWatermark enabled. */
export function hasForceCUIWatermark(role: string): boolean {
  const roleConfig = getRoleConfig(role)
  if (!roleConfig) return false
  const security = roleConfig.security as { forceCUIWatermark?: boolean } | undefined
  return security?.forceCUIWatermark === true
}

/** Get classification ceiling for a role. */
export function getClassificationCeiling(role: string): string {
  const roleConfig = getRoleConfig(role)
  if (!roleConfig) return 'PUBLIC'
  const security = roleConfig.security as { classificationCeiling?: string } | undefined
  return security?.classificationCeiling ?? 'PUBLIC'
}

/** Get gate authority for a role (which gates they can approve, trigger review, override). */
export interface GateAuthority {
  canApprove: string[]
  canTriggerReview: boolean
  canOverrideGate: boolean
}

export function getGateAuthority(role: string): GateAuthority {
  const roleConfig = getRoleConfig(role)
  if (!roleConfig) return { canApprove: [], canTriggerReview: false, canOverrideGate: false }
  const ga = roleConfig.gateAuthority as {
    canApprove?: string[]
    canTriggerReview?: boolean
    canOverrideGate?: boolean
  } | undefined
  return {
    canApprove: ga?.canApprove ?? [],
    canTriggerReview: ga?.canTriggerReview ?? false,
    canOverrideGate: ga?.canOverrideGate ?? false,
  }
}

/** Get session timeout in seconds for a role. */
export function getSessionTimeout(role: string): number {
  const roleConfig = getRoleConfig(role)
  if (!roleConfig) return 3600
  const security = roleConfig.security as { sessionTimeout?: number } | undefined
  return security?.sessionTimeout ?? 28800
}
