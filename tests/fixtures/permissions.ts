/**
 * Mock permission fixtures for different roles.
 *
 * Matches the structure from lib/rbac/config.ts ModulePermission.
 *
 * v1.8 Sprint 50 T-50.3
 */

export interface MockModulePermission {
  shouldRender: boolean
  canView: boolean
  canEdit: boolean
}

/** Full access — executive/operations on most modules */
export const fullAccess: MockModulePermission = {
  shouldRender: true,
  canView: true,
  canEdit: true,
}

/** View-only — author on pipeline, capture_manager on admin */
export const viewOnly: MockModulePermission = {
  shouldRender: true,
  canView: true,
  canEdit: false,
}

/** No access — partner/subcontractor on internal modules */
export const noAccess: MockModulePermission = {
  shouldRender: false,
  canView: false,
  canEdit: false,
}

/** Permission set for common role/module combos. */
export const rolePermissions: Record<string, Record<string, MockModulePermission>> = {
  executive: {
    dashboard: viewOnly,
    pipeline: fullAccess,
    admin: fullAccess,
    compliance: fullAccess,
    proposals: fullAccess,
  },
  author: {
    dashboard: viewOnly,
    pipeline: viewOnly,
    admin: noAccess,
    compliance: viewOnly,
    proposals: { shouldRender: true, canView: true, canEdit: true },
  },
  partner: {
    dashboard: noAccess,
    pipeline: noAccess,
    admin: noAccess,
    compliance: noAccess,
    proposals: viewOnly,
  },
}

/** Get permissions for a role/module combination. */
export function getMockPermission(
  role: string,
  moduleId: string
): MockModulePermission {
  return rolePermissions[role]?.[moduleId] ?? noAccess
}
