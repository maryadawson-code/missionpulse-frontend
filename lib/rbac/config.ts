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
