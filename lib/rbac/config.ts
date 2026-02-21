// filepath: lib/rbac/config.ts
import rbacJson from './roles_permissions_config.json'

/**
 * RBAC configuration from roles_permissions_config.json (v9.5).
 *
 * This is the client-side (UI) RBAC source. Server-side access
 * control is enforced by RLS helper functions in Supabase.
 * These two layers MUST agree.
 */
const rbacConfig = rbacJson as typeof rbacJson

export default rbacConfig

// ---------------------------------------------------------------------------
// Canonical types derived from the JSON config
// ---------------------------------------------------------------------------

/** All 12 role identifiers from roles_permissions_config.json v9.5 */
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

/** All 14 module identifiers from roles_permissions_config.json v9.5 */
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

/** Permission triple for a single role×module intersection */
export interface ModulePermission {
  shouldRender: boolean
  canView: boolean
  canEdit: boolean
  /** Scope restriction for external roles (e.g. "assigned_opportunities_only") */
  scopeRestriction?: string
}

/** Navigation item from the config's navigationConfig */
export interface NavItem {
  id: ModuleId
  label: string
  icon: string
  route: string
  badge?: string
}

/** Fail-closed default — renders nothing, sees nothing, edits nothing */
const DENIED: ModulePermission = {
  shouldRender: false,
  canView: false,
  canEdit: false,
}

/** Default fallback role when DB role is null or unrecognised */
const DEFAULT_ROLE: ConfigRoleId = 'partner'

/** Set of valid config role IDs for fast lookup */
const VALID_ROLES = new Set<string>([
  'executive',
  'operations',
  'capture_manager',
  'proposal_manager',
  'volume_lead',
  'pricing_manager',
  'contracts',
  'hr_staffing',
  'author',
  'partner',
  'subcontractor',
  'consultant',
])

/** Internal role types — external roles get CUI watermarking */
const EXTERNAL_ROLES = new Set<string>(['partner', 'subcontractor', 'consultant'])

// ---------------------------------------------------------------------------
// Role resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a raw DB role string to a canonical ConfigRoleId.
 * Returns DEFAULT_ROLE ('partner') if null or unrecognised — fail closed.
 */
export function resolveRole(dbRole: string | null): ConfigRoleId {
  if (dbRole && VALID_ROLES.has(dbRole)) {
    return dbRole as ConfigRoleId
  }
  return DEFAULT_ROLE
}

/**
 * Check if a raw DB role is an internal (non-external) role.
 * Returns false if null or unrecognised — fail closed.
 */
export function isInternalRole(dbRole: string | null): boolean {
  if (!dbRole || !VALID_ROLES.has(dbRole)) return false
  return !EXTERNAL_ROLES.has(dbRole)
}

// ---------------------------------------------------------------------------
// Role config lookup
// ---------------------------------------------------------------------------

interface RoleConfigSummary {
  displayName: string
  type: string
  uiComplexityLevel: string
}

const FALLBACK_CONFIG: RoleConfigSummary = {
  displayName: 'Partner',
  type: 'external',
  uiComplexityLevel: 'simplified',
}

/**
 * Get display metadata for a resolved ConfigRoleId.
 */
export function getRoleConfig(role: ConfigRoleId): RoleConfigSummary {
  const roleConfig = rbacConfig.roles[role as keyof typeof rbacConfig.roles]
  if (!roleConfig) return FALLBACK_CONFIG

  return {
    displayName: (roleConfig as Record<string, unknown>).displayName as string ?? FALLBACK_CONFIG.displayName,
    type: (roleConfig as Record<string, unknown>).type as string ?? FALLBACK_CONFIG.type,
    uiComplexityLevel: (roleConfig as Record<string, unknown>).uiComplexityLevel as string ?? FALLBACK_CONFIG.uiComplexityLevel,
  }
}

// ---------------------------------------------------------------------------
// Permission lookups
// ---------------------------------------------------------------------------

/**
 * Get the full permission triple for a role×module pair.
 * Accepts null dbRole — resolves to default role first.
 * Returns DENIED if the role or module is unknown (fail closed).
 */
export function getModulePermission(
  dbRole: string | null,
  moduleId: ModuleId
): ModulePermission {
  const resolved = resolveRole(dbRole)
  const roleConfig = rbacConfig.roles[resolved as keyof typeof rbacConfig.roles]
  if (!roleConfig || !('modules' in roleConfig)) return DENIED

  const modules = roleConfig.modules as Record<
    string,
    { shouldRender?: boolean; canView?: boolean; canEdit?: boolean }
  >
  const mod = modules[moduleId]
  if (!mod) return DENIED

  const perm: ModulePermission = {
    shouldRender: mod.shouldRender === true,
    canView: mod.canView === true,
    canEdit: mod.canEdit === true,
  }

  // Attach scope restriction for external roles
  if (EXTERNAL_ROLES.has(resolved) && 'scopeRestriction' in roleConfig) {
    const restriction = (roleConfig as Record<string, unknown>).scopeRestriction
    if (typeof restriction === 'string') {
      perm.scopeRestriction = restriction
    }
  }

  return perm
}

/**
 * Check if a role can render a specific module.
 * Returns false if the role or module is unknown (fail closed).
 */
export function canRenderModule(role: string, module: string): boolean {
  const roleConfig = rbacConfig.roles[role as keyof typeof rbacConfig.roles]
  if (!roleConfig || !('modules' in roleConfig)) return false

  const modules = roleConfig.modules as Record<
    string,
    { shouldRender?: boolean }
  >
  return modules[module]?.shouldRender === true
}

/**
 * Check if a role can edit within a module.
 * Returns false if uncertain (fail closed).
 */
export function canEditModule(role: string, module: string): boolean {
  const roleConfig = rbacConfig.roles[role as keyof typeof rbacConfig.roles]
  if (!roleConfig || !('modules' in roleConfig)) return false

  const modules = roleConfig.modules as Record<
    string,
    { shouldRender?: boolean; canEdit?: boolean }
  >
  const mod = modules[module]
  return mod?.shouldRender === true && mod?.canEdit === true
}

/**
 * Get all allowed modules for a role.
 */
export function getAllowedModules(role: string): string[] {
  const roleConfig = rbacConfig.roles[role as keyof typeof rbacConfig.roles]
  if (!roleConfig || !('modules' in roleConfig)) return []

  const modules = roleConfig.modules as Record<
    string,
    { shouldRender?: boolean }
  >
  return Object.entries(modules)
    .filter(([, config]) => config.shouldRender === true)
    .map(([key]) => key)
}

// ---------------------------------------------------------------------------
// Navigation filtering
// ---------------------------------------------------------------------------

const navConfig = rbacConfig.navigationConfig as {
  primaryNav: NavItem[]
  secondaryNav: NavItem[]
  adminNav: NavItem[]
}

/**
 * Get visible nav items for a role, filtered by shouldRender.
 * Accepts null dbRole — resolves to default role first.
 */
export function getVisibleNav(dbRole: string | null): {
  primary: NavItem[]
  secondary: NavItem[]
  admin: NavItem[]
} {
  const resolved = resolveRole(dbRole)

  function filterNav(items: NavItem[]): NavItem[] {
    return items.filter((item) => canRenderModule(resolved, item.id))
  }

  return {
    primary: filterNav(navConfig.primaryNav),
    secondary: filterNav(navConfig.secondaryNav),
    admin: filterNav(navConfig.adminNav),
  }
}
