// filepath: lib/rbac/index.ts
// Barrel export — import from '@/lib/rbac' for client-safe exports
// For server-only imports, use '@/lib/rbac/server' directly

export {
  // Types
  type ConfigRoleId,
  type ModuleId,
  type ModulePermission,
  type RoleConfig,
  type NavItem,
  // Functions
  resolveRole,
  getRoleConfig,
  getModulePermission,
  getVisibleNav,
  isInternalRole,
  getUIComplexityLevel,
} from './config'

export {
  useRole,
  useModuleAccess,
  useVisibleNav,
} from './hooks'
