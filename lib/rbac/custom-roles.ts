/**
 * Custom Role Management — Enterprise RBAC Extension
 * Sprint 32 (T-32.2) — Phase L v2.0
 *
 * Manages company-specific custom roles that extend the default
 * 12-role RBAC system. Matches custom_roles table schema.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import type { ModulePermission, ModuleId } from './config'

// ─── Types ──────────────────────────────────────────────────────

export interface CustomRole {
  id: string
  organizationId: string | null
  roleName: string
  displayName: string
  description: string | null
  baseRole: string
  modulePermissions: Record<string, ModulePermission>
  isActive: boolean
  isExternalRole: boolean
  createdBy: string | null
  createdAt: string
}

interface CustomRoleInput {
  roleName: string
  displayName: string
  description?: string
  baseRole: string
  modulePermissions: Record<string, ModulePermission>
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get all custom roles for a company (organization).
 */
export async function getCustomRoles(organizationId: string): Promise<CustomRole[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('custom_roles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  return (data ?? []).map(row => ({
    id: row.id,
    organizationId: row.organization_id,
    roleName: row.role_name,
    displayName: row.display_name,
    description: row.description,
    baseRole: row.base_role,
    modulePermissions: (row.module_permissions ?? {}) as unknown as Record<string, ModulePermission>,
    isActive: row.is_active ?? true,
    isExternalRole: row.is_external_role ?? false,
    createdBy: row.created_by,
    createdAt: row.created_at ?? new Date().toISOString(),
  }))
}

/**
 * Evaluate permission for a custom role on a specific module.
 */
export async function evaluateCustomRole(
  roleId: string,
  module: ModuleId
): Promise<ModulePermission> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('custom_roles')
    .select('module_permissions')
    .eq('id', roleId)
    .single()

  if (!data?.module_permissions) {
    return { shouldRender: false, canView: false, canEdit: false }
  }

  const perms = data.module_permissions as unknown as Record<string, ModulePermission>
  return perms[module] ?? { shouldRender: false, canView: false, canEdit: false }
}

/**
 * Create a new custom role for a company.
 */
export async function createCustomRole(
  organizationId: string,
  config: CustomRoleInput,
  userId: string
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  const supabase = await createClient()

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('custom_roles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role_name', config.roleName)
    .single()

  if (existing) {
    return { success: false, error: `Role "${config.roleName}" already exists` }
  }

  const { data, error } = await supabase
    .from('custom_roles')
    .insert({
      organization_id: organizationId,
      role_name: config.roleName,
      display_name: config.displayName,
      description: config.description ?? null,
      base_role: config.baseRole,
      module_permissions: JSON.parse(JSON.stringify(config.modulePermissions)),
      is_active: true,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, roleId: data?.id }
}

/**
 * Update a custom role's permissions.
 */
export async function updateCustomRole(
  roleId: string,
  config: Partial<CustomRoleInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (config.roleName) updates.role_name = config.roleName
  if (config.displayName) updates.display_name = config.displayName
  if (config.description !== undefined) updates.description = config.description
  if (config.modulePermissions) updates.module_permissions = JSON.parse(JSON.stringify(config.modulePermissions))

  const { error } = await supabase
    .from('custom_roles')
    .update(updates)
    .eq('id', roleId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Delete a custom role.
 */
export async function deleteCustomRole(
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('custom_roles')
    .delete()
    .eq('id', roleId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
