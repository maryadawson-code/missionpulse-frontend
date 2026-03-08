import { describe, it, expect } from 'vitest'
import {
  resolveRole,
  hasPermission,
  getModulePermission,
} from '@/lib/rbac/config'

const ALL_ROLES = [
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
]

describe('RBAC Config', () => {
  it('all 12 roles exist and resolve correctly', () => {
    for (const role of ALL_ROLES) {
      const resolved = resolveRole(role)
      expect(resolved).toBe(role)
    }
  })

  it('resolveRole maps legacy strings to valid roles', () => {
    expect(resolveRole('ceo')).toBe('executive')
    expect(resolveRole('admin')).toBe('executive')
    expect(resolveRole('coo')).toBe('operations')
    expect(resolveRole(null)).toBe('partner')
    expect(resolveRole(undefined)).toBe('partner')
  })

  it('hasPermission returns true for valid role+module combos', () => {
    expect(hasPermission('executive', 'dashboard', 'shouldRender')).toBe(true)
    expect(hasPermission('executive', 'pipeline', 'canView')).toBe(true)
    expect(hasPermission('executive', 'admin', 'canEdit')).toBe(true)
    expect(hasPermission('operations', 'workflow_board', 'shouldRender')).toBe(true)
    expect(hasPermission('capture_manager', 'proposals', 'canView')).toBe(true)
    expect(hasPermission('author', 'documents', 'shouldRender')).toBe(true)
  })

  it('hasPermission returns false for denied combos', () => {
    expect(hasPermission('partner', 'admin', 'shouldRender')).toBe(false)
    expect(hasPermission('subcontractor', 'admin', 'canEdit')).toBe(false)
    expect(hasPermission('consultant', 'admin', 'canEdit')).toBe(false)
  })

  it('invisible RBAC invariant: shouldRender=false implies canView=false AND canEdit=false', () => {
    const modules = [
      'dashboard', 'pipeline', 'proposals', 'pricing', 'strategy',
      'blackhat', 'compliance', 'personnel', 'workflow_board',
      'documents', 'ai_chat', 'analytics', 'admin', 'audit_log',
    ]

    for (const role of ALL_ROLES) {
      for (const mod of modules) {
        const perm = getModulePermission(role, mod as Parameters<typeof getModulePermission>[1])
        if (perm && !perm.shouldRender) {
          expect(perm.canView).toBe(false)
          expect(perm.canEdit).toBe(false)
        }
      }
    }
  })

  it('getModulePermission returns defined permissions for all modules and executive', () => {
    const modules = ['dashboard', 'pipeline', 'proposals', 'pricing', 'strategy', 'admin']
    for (const mod of modules) {
      const perm = getModulePermission('executive', mod as Parameters<typeof getModulePermission>[1])
      expect(perm).toBeDefined()
      expect(perm?.shouldRender).toBe(true)
    }
  })
})
