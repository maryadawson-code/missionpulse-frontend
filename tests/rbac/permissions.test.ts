// filepath: tests/rbac/permissions.test.ts
// Comprehensive regression tests for the RBAC permission system.
// Tests the real module — no mocking of lib/rbac/config.ts.

import { describe, it, expect } from 'vitest'
import {
  resolveRole,
  hasPermission,
  getModulePermission,
  getVisibleNav,
  getRolePermissions,
  getRoleConfig,
  getRoleDisplayName,
  getUIComplexityLevel,
  isInternalRole,
  getAllowedAgents,
  hasForceCUIWatermark,
  getClassificationCeiling,
  getGateAuthority,
  getSessionTimeout,
  getTierVisibleModules,
  filterPermissionsByTier,
} from '@/lib/rbac/config'
import type { ConfigRoleId, ModuleId, ModulePermission } from '@/lib/rbac/config'
import rbacConfig from '@/roles_permissions_config.json'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_ROLES: ConfigRoleId[] = [
  'executive', 'operations', 'capture_manager', 'proposal_manager',
  'volume_lead', 'pricing_manager', 'contracts', 'hr_staffing',
  'author', 'partner', 'subcontractor', 'consultant',
]

const ALL_MODULES: ModuleId[] = [
  'dashboard', 'pipeline', 'proposals', 'pricing', 'strategy',
  'blackhat', 'compliance', 'workflow_board', 'ai_chat',
  'documents', 'analytics', 'admin', 'integrations', 'audit_log', 'personnel',
]

const DENY_ALL: ModulePermission = { shouldRender: false, canView: false, canEdit: false }

// ---------------------------------------------------------------------------
// 1. resolveRole() — maps DB roles to config roles
// ---------------------------------------------------------------------------

describe('resolveRole()', () => {
  it('returns "partner" (most restrictive) for null', () => {
    expect(resolveRole(null)).toBe('partner')
  })

  it('returns "partner" (most restrictive) for undefined', () => {
    expect(resolveRole(undefined)).toBe('partner')
  })

  it('returns "partner" for empty string', () => {
    expect(resolveRole('')).toBe('partner')
  })

  it('maps all 12 valid roles to themselves', () => {
    for (const role of ALL_ROLES) {
      expect(resolveRole(role)).toBe(role)
    }
  })

  describe('legacy role mappings', () => {
    const legacyCases: [string, ConfigRoleId][] = [
      ['ceo', 'executive'],
      ['admin', 'executive'],
      ['coo', 'operations'],
      ['cap', 'capture_manager'],
      ['pm', 'proposal_manager'],
      ['sa', 'volume_lead'],
      ['fin', 'pricing_manager'],
      ['con', 'contracts'],
      ['del', 'hr_staffing'],
      ['qa', 'author'],
    ]

    it.each(legacyCases)('"%s" maps to "%s"', (legacy, expected) => {
      expect(resolveRole(legacy)).toBe(expected)
    })
  })

  it('returns "partner" for unknown/garbage roles', () => {
    expect(resolveRole('superadmin')).toBe('partner')
    expect(resolveRole('root')).toBe('partner')
    expect(resolveRole('god_mode')).toBe('partner')
    expect(resolveRole('NONEXISTENT')).toBe('partner')
  })

  describe('case-insensitive handling', () => {
    it('normalizes uppercase role names', () => {
      expect(resolveRole('EXECUTIVE')).toBe('executive')
      expect(resolveRole('Executive')).toBe('executive')
      expect(resolveRole('OPERATIONS')).toBe('operations')
    })

    it('normalizes uppercase legacy roles', () => {
      expect(resolveRole('CEO')).toBe('executive')
      expect(resolveRole('ADMIN')).toBe('executive')
      expect(resolveRole('COO')).toBe('operations')
      expect(resolveRole('PM')).toBe('proposal_manager')
    })

    it('normalizes mixed case', () => {
      expect(resolveRole('Capture_Manager')).toBe('capture_manager')
      expect(resolveRole('Pricing_Manager')).toBe('pricing_manager')
    })
  })

  describe('whitespace and hyphen normalization', () => {
    it('converts spaces to underscores', () => {
      expect(resolveRole('capture manager')).toBe('capture_manager')
      expect(resolveRole('proposal manager')).toBe('proposal_manager')
      expect(resolveRole('hr staffing')).toBe('hr_staffing')
      expect(resolveRole('volume lead')).toBe('volume_lead')
    })

    it('converts hyphens to underscores', () => {
      expect(resolveRole('capture-manager')).toBe('capture_manager')
      expect(resolveRole('hr-staffing')).toBe('hr_staffing')
      expect(resolveRole('pricing-manager')).toBe('pricing_manager')
    })
  })
})

// ---------------------------------------------------------------------------
// 2. hasPermission() — checks specific permissions
// ---------------------------------------------------------------------------

describe('hasPermission()', () => {
  describe('ALLOW cases', () => {
    it('executive has admin canEdit', () => {
      expect(hasPermission('executive', 'admin', 'canEdit')).toBe(true)
    })

    it('executive has admin shouldRender', () => {
      expect(hasPermission('executive', 'admin', 'shouldRender')).toBe(true)
    })

    it('author has proposals canEdit', () => {
      expect(hasPermission('author', 'proposals', 'canEdit')).toBe(true)
    })

    it('capture_manager has pipeline canEdit', () => {
      expect(hasPermission('capture_manager', 'pipeline', 'canEdit')).toBe(true)
    })

    it('pricing_manager has pricing canEdit', () => {
      expect(hasPermission('pricing_manager', 'pricing', 'canEdit')).toBe(true)
    })

    it('contracts has compliance canEdit', () => {
      expect(hasPermission('contracts', 'compliance', 'canEdit')).toBe(true)
    })

    it('partner has proposals canEdit (scoped)', () => {
      expect(hasPermission('partner', 'proposals', 'canEdit')).toBe(true)
    })

    it('hr_staffing has personnel canEdit', () => {
      expect(hasPermission('hr_staffing', 'personnel', 'canEdit')).toBe(true)
    })
  })

  describe('DENY cases', () => {
    it('partner does NOT have admin canEdit', () => {
      expect(hasPermission('partner', 'admin', 'canEdit')).toBe(false)
    })

    it('partner does NOT have admin shouldRender', () => {
      expect(hasPermission('partner', 'admin', 'shouldRender')).toBe(false)
    })

    it('author does NOT have dashboard shouldRender', () => {
      expect(hasPermission('author', 'dashboard', 'shouldRender')).toBe(false)
    })

    it('author does NOT have admin canEdit', () => {
      expect(hasPermission('author', 'admin', 'canEdit')).toBe(false)
    })

    it('subcontractor does NOT have analytics shouldRender', () => {
      expect(hasPermission('subcontractor', 'analytics', 'shouldRender')).toBe(false)
    })

    it('consultant does NOT have pricing shouldRender', () => {
      expect(hasPermission('consultant', 'pricing', 'shouldRender')).toBe(false)
    })

    it('volume_lead does NOT have pipeline shouldRender', () => {
      expect(hasPermission('volume_lead', 'pipeline', 'shouldRender')).toBe(false)
    })

    it('operations does NOT have admin shouldRender', () => {
      expect(hasPermission('operations', 'admin', 'shouldRender')).toBe(false)
    })

    it('capture_manager does NOT have pricing shouldRender', () => {
      expect(hasPermission('capture_manager', 'pricing', 'shouldRender')).toBe(false)
    })

    it('proposal_manager does NOT have blackhat shouldRender', () => {
      expect(hasPermission('proposal_manager', 'blackhat', 'shouldRender')).toBe(false)
    })
  })

  describe('view-without-edit separation', () => {
    it('executive can view dashboard but NOT edit', () => {
      expect(hasPermission('executive', 'dashboard', 'canView')).toBe(true)
      expect(hasPermission('executive', 'dashboard', 'canEdit')).toBe(false)
    })

    it('executive can view analytics but NOT edit', () => {
      expect(hasPermission('executive', 'analytics', 'canView')).toBe(true)
      expect(hasPermission('executive', 'analytics', 'canEdit')).toBe(false)
    })

    it('consultant can view proposals but NOT edit', () => {
      expect(hasPermission('consultant', 'proposals', 'canView')).toBe(true)
      expect(hasPermission('consultant', 'proposals', 'canEdit')).toBe(false)
    })

    it('contracts can view workflow_board but NOT edit', () => {
      expect(hasPermission('contracts', 'workflow_board', 'canView')).toBe(true)
      expect(hasPermission('contracts', 'workflow_board', 'canEdit')).toBe(false)
    })
  })

  describe('legacy role passthrough', () => {
    it('"ceo" inherits executive permissions via resolveRole', () => {
      expect(hasPermission('ceo', 'admin', 'canEdit')).toBe(true)
    })

    it('"qa" inherits author permissions (no admin)', () => {
      expect(hasPermission('qa', 'admin', 'canEdit')).toBe(false)
      expect(hasPermission('qa', 'proposals', 'canEdit')).toBe(true)
    })
  })

  describe('unknown roles default to partner permissions', () => {
    it('unknown role has partner-level access', () => {
      expect(hasPermission('totallyFakeRole', 'admin', 'shouldRender')).toBe(false)
      expect(hasPermission('totallyFakeRole', 'proposals', 'canEdit')).toBe(true)
      expect(hasPermission('totallyFakeRole', 'pipeline', 'shouldRender')).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. getModulePermission() — returns permission triple
// ---------------------------------------------------------------------------

describe('getModulePermission()', () => {
  it('returns correct permission triple for executive + admin', () => {
    const perm = getModulePermission('executive', 'admin')
    expect(perm).toEqual({ shouldRender: true, canView: true, canEdit: true })
  })

  it('returns correct permission triple for executive + dashboard (view-only)', () => {
    const perm = getModulePermission('executive', 'dashboard')
    expect(perm).toEqual({ shouldRender: true, canView: true, canEdit: false })
  })

  it('returns correct permission triple for partner + proposals (scoped)', () => {
    const perm = getModulePermission('partner', 'proposals')
    expect(perm.shouldRender).toBe(true)
    expect(perm.canView).toBe(true)
    expect(perm.canEdit).toBe(true)
    expect(perm.scopeRestriction).toBe('assigned_sections_only')
  })

  it('returns DENY_ALL for partner + admin', () => {
    const perm = getModulePermission('partner', 'admin')
    expect(perm).toEqual(DENY_ALL)
  })

  it('returns DENY_ALL for unknown role', () => {
    const perm = getModulePermission('nonexistentRole', 'admin')
    // Unknown role resolves to partner, which has no admin access
    expect(perm).toEqual(DENY_ALL)
  })

  it('returns DENY_ALL for unknown module on a valid role', () => {
    const perm = getModulePermission('executive', 'nonexistent_module' as ModuleId)
    expect(perm).toEqual(DENY_ALL)
  })

  it('returns DENY_ALL for both unknown role and unknown module', () => {
    const perm = getModulePermission('fakeRole', 'fakeModule' as ModuleId)
    expect(perm).toEqual(DENY_ALL)
  })

  it('preserves scopeRestriction for scoped roles', () => {
    expect(getModulePermission('partner', 'workflow_board').scopeRestriction).toBe('own_tasks_only')
    expect(getModulePermission('partner', 'documents').scopeRestriction).toBe('assigned_documents_only')
    expect(getModulePermission('subcontractor', 'proposals').scopeRestriction).toBe('assigned_sections_only')
  })

  it('does not add scopeRestriction for unscoped roles', () => {
    expect(getModulePermission('executive', 'proposals').scopeRestriction).toBeUndefined()
    expect(getModulePermission('operations', 'pipeline').scopeRestriction).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 4. getVisibleNav() — returns correct nav items for different roles
// ---------------------------------------------------------------------------

describe('getVisibleNav()', () => {
  it('returns primary, secondary, and admin arrays', () => {
    const nav = getVisibleNav('executive')
    expect(nav).toHaveProperty('primary')
    expect(nav).toHaveProperty('secondary')
    expect(nav).toHaveProperty('admin')
    expect(Array.isArray(nav.primary)).toBe(true)
    expect(Array.isArray(nav.secondary)).toBe(true)
    expect(Array.isArray(nav.admin)).toBe(true)
  })

  describe('executive nav', () => {
    it('sees admin nav items', () => {
      const nav = getVisibleNav('executive')
      const adminLabels = nav.admin.map((i) => i.module)
      expect(adminLabels).toContain('admin')
      expect(adminLabels).toContain('audit_log')
      // Note: integrations has shouldRender=true for executive but no NAV_ITEMS entry
    })

    it('sees all primary nav items', () => {
      const nav = getVisibleNav('executive')
      const primaryModules = nav.primary.map((i) => i.module)
      expect(primaryModules).toContain('dashboard')
      expect(primaryModules).toContain('pipeline')
      expect(primaryModules).toContain('proposals')
    })

    it('sees secondary nav items', () => {
      const nav = getVisibleNav('executive')
      const secondaryModules = nav.secondary.map((i) => i.module)
      expect(secondaryModules).toContain('analytics')
      expect(secondaryModules).toContain('documents')
      expect(secondaryModules).toContain('ai_chat')
    })
  })

  describe('partner nav', () => {
    it('does NOT see admin nav items', () => {
      const nav = getVisibleNav('partner')
      expect(nav.admin).toHaveLength(0)
    })

    it('does NOT see dashboard in primary', () => {
      const nav = getVisibleNav('partner')
      const primaryModules = nav.primary.map((i) => i.module)
      expect(primaryModules).not.toContain('dashboard')
    })

    it('does NOT see pipeline in primary', () => {
      const nav = getVisibleNav('partner')
      const primaryModules = nav.primary.map((i) => i.module)
      expect(primaryModules).not.toContain('pipeline')
    })

    it('sees proposals and workflow', () => {
      const nav = getVisibleNav('partner')
      const primaryModules = nav.primary.map((i) => i.module)
      expect(primaryModules).toContain('proposals')
      expect(primaryModules).toContain('workflow_board')
    })
  })

  describe('author nav', () => {
    it('does NOT see admin nav items', () => {
      const nav = getVisibleNav('author')
      expect(nav.admin).toHaveLength(0)
    })

    it('does NOT see dashboard', () => {
      const nav = getVisibleNav('author')
      const allModules = [
        ...nav.primary.map((i) => i.module),
        ...nav.secondary.map((i) => i.module),
        ...nav.admin.map((i) => i.module),
      ]
      expect(allModules).not.toContain('dashboard')
    })

    it('sees proposals and workflow', () => {
      const nav = getVisibleNav('author')
      const primaryModules = nav.primary.map((i) => i.module)
      expect(primaryModules).toContain('proposals')
      expect(primaryModules).toContain('workflow_board')
    })
  })

  describe('operations nav', () => {
    it('does NOT see admin nav (shouldRender=false for operations)', () => {
      const nav = getVisibleNav('operations')
      const adminModules = nav.admin.map((i) => i.module)
      expect(adminModules).not.toContain('admin')
    })

    it('sees audit_log in admin nav (shouldRender=true)', () => {
      const nav = getVisibleNav('operations')
      const adminModules = nav.admin.map((i) => i.module)
      expect(adminModules).toContain('audit_log')
      // integrations has shouldRender=true but no NAV_ITEMS entry in the sidebar config
    })
  })

  it('nav items have correct shape', () => {
    const nav = getVisibleNav('executive')
    const allItems = [...nav.primary, ...nav.secondary, ...nav.admin]
    for (const item of allItems) {
      expect(item).toHaveProperty('module')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('href')
      expect(item).toHaveProperty('iconPath')
      expect(typeof item.label).toBe('string')
      expect(typeof item.href).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Invisible RBAC invariant
// ---------------------------------------------------------------------------

describe('Invisible RBAC invariant', () => {
  it('shouldRender=false implies canView=false AND canEdit=false for every role/module', () => {
    for (const role of ALL_ROLES) {
      for (const mod of ALL_MODULES) {
        const perm = getModulePermission(role, mod)
        if (!perm.shouldRender) {
          expect(
            perm.canView,
            `${role}/${mod}: shouldRender=false but canView=true`
          ).toBe(false)
          expect(
            perm.canEdit,
            `${role}/${mod}: shouldRender=false but canEdit=true`
          ).toBe(false)
        }
      }
    }
  })

  it('canEdit=true implies canView=true for every role/module', () => {
    for (const role of ALL_ROLES) {
      for (const mod of ALL_MODULES) {
        const perm = getModulePermission(role, mod)
        if (perm.canEdit) {
          expect(
            perm.canView,
            `${role}/${mod}: canEdit=true but canView=false`
          ).toBe(true)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 6. Security-critical boundary tests
// ---------------------------------------------------------------------------

describe('Security boundaries', () => {
  const externalRoles: ConfigRoleId[] = ['partner', 'subcontractor', 'consultant']
  const sensitiveModules: ModuleId[] = ['admin', 'audit_log', 'integrations']

  it('no external role can access admin, audit_log, or integrations', () => {
    for (const role of externalRoles) {
      for (const mod of sensitiveModules) {
        expect(
          hasPermission(role, mod, 'shouldRender'),
          `External role "${role}" should NOT render "${mod}"`
        ).toBe(false)
        expect(
          hasPermission(role, mod, 'canEdit'),
          `External role "${role}" should NOT edit "${mod}"`
        ).toBe(false)
      }
    }
  })

  it('only executive can edit admin module', () => {
    for (const role of ALL_ROLES) {
      if (role === 'executive') {
        expect(hasPermission(role, 'admin', 'canEdit')).toBe(true)
      } else {
        expect(
          hasPermission(role, 'admin', 'canEdit'),
          `Non-executive role "${role}" should NOT edit admin`
        ).toBe(false)
      }
    }
  })

  it('only executive sees admin shouldRender=true', () => {
    for (const role of ALL_ROLES) {
      if (role === 'executive') {
        expect(hasPermission(role, 'admin', 'shouldRender')).toBe(true)
      } else {
        expect(
          hasPermission(role, 'admin', 'shouldRender'),
          `Non-executive role "${role}" should NOT render admin`
        ).toBe(false)
      }
    }
  })

  it('no external role can access blackhat reviews', () => {
    for (const role of externalRoles) {
      expect(hasPermission(role, 'blackhat', 'shouldRender')).toBe(false)
      expect(hasPermission(role, 'blackhat', 'canView')).toBe(false)
    }
  })

  it('no external role can access pipeline', () => {
    for (const role of externalRoles) {
      expect(hasPermission(role, 'pipeline', 'shouldRender')).toBe(false)
    }
  })

  it('no external role can access analytics', () => {
    for (const role of externalRoles) {
      expect(hasPermission(role, 'analytics', 'shouldRender')).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 7. isInternalRole()
// ---------------------------------------------------------------------------

describe('isInternalRole()', () => {
  it('internal roles return true', () => {
    const internalRoles: ConfigRoleId[] = [
      'executive', 'operations', 'capture_manager', 'proposal_manager',
      'volume_lead', 'pricing_manager', 'contracts', 'hr_staffing', 'author',
    ]
    for (const role of internalRoles) {
      expect(isInternalRole(role), `${role} should be internal`).toBe(true)
    }
  })

  it('external roles return false', () => {
    const externalRoles: ConfigRoleId[] = ['partner', 'subcontractor', 'consultant']
    for (const role of externalRoles) {
      expect(isInternalRole(role), `${role} should be external`).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 8. getRoleDisplayName() and getUIComplexityLevel()
// ---------------------------------------------------------------------------

describe('getRoleDisplayName()', () => {
  it('returns configured display names', () => {
    expect(getRoleDisplayName('executive')).toBe('Executive / Admin')
    expect(getRoleDisplayName('partner')).toBe('Teaming Partner')
    expect(getRoleDisplayName('author')).toBe('Author / SME')
    expect(getRoleDisplayName('pricing_manager')).toBe('Pricing / Cost Volume Lead')
  })

  it('falls back to formatted role string for unknown roles', () => {
    // Unknown role resolves to partner, which has a display name
    expect(getRoleDisplayName('unknown_thing')).toBe('Teaming Partner')
  })
})

describe('getUIComplexityLevel()', () => {
  it('executive gets admin complexity', () => {
    expect(getUIComplexityLevel('executive')).toBe('admin')
  })

  it('operations gets advanced complexity', () => {
    expect(getUIComplexityLevel('operations')).toBe('advanced')
  })

  it('author gets simplified complexity', () => {
    expect(getUIComplexityLevel('author')).toBe('simplified')
  })

  it('partner gets simplified complexity', () => {
    expect(getUIComplexityLevel('partner')).toBe('simplified')
  })
})

// ---------------------------------------------------------------------------
// 9. Security metadata functions
// ---------------------------------------------------------------------------

describe('hasForceCUIWatermark()', () => {
  it('external roles have CUI watermark forced', () => {
    expect(hasForceCUIWatermark('partner')).toBe(true)
    expect(hasForceCUIWatermark('subcontractor')).toBe(true)
    expect(hasForceCUIWatermark('consultant')).toBe(true)
  })

  it('executive does NOT have CUI watermark forced', () => {
    expect(hasForceCUIWatermark('executive')).toBe(false)
  })

  it('pricing_manager and hr_staffing have CUI watermark forced', () => {
    expect(hasForceCUIWatermark('pricing_manager')).toBe(true)
    expect(hasForceCUIWatermark('hr_staffing')).toBe(true)
  })
})

describe('getClassificationCeiling()', () => {
  it('executive has highest ceiling', () => {
    expect(getClassificationCeiling('executive')).toBe('CUI//SP-CTI//SP-PROPIN')
  })

  it('partner has PUBLIC ceiling', () => {
    expect(getClassificationCeiling('partner')).toBe('PUBLIC')
  })

  it('returns PUBLIC for unknown role', () => {
    // Unknown -> partner -> PUBLIC
    expect(getClassificationCeiling('nonexistent')).toBe('PUBLIC')
  })
})

describe('getSessionTimeout()', () => {
  it('executive gets 28800 seconds (8 hours)', () => {
    expect(getSessionTimeout('executive')).toBe(28800)
  })

  it('partner gets 3600 seconds (1 hour)', () => {
    expect(getSessionTimeout('partner')).toBe(3600)
  })

  it('hr_staffing gets 7200 seconds (2 hours)', () => {
    expect(getSessionTimeout('hr_staffing')).toBe(7200)
  })
})

// ---------------------------------------------------------------------------
// 10. Gate authority
// ---------------------------------------------------------------------------

describe('getGateAuthority()', () => {
  it('executive can approve gates and override', () => {
    const ga = getGateAuthority('executive')
    expect(ga.canApprove).toContain('gate1')
    expect(ga.canApprove).toContain('gold')
    expect(ga.canApprove).toContain('submit')
    expect(ga.canTriggerReview).toBe(true)
    expect(ga.canOverrideGate).toBe(true)
  })

  it('partner has no gate authority', () => {
    const ga = getGateAuthority('partner')
    expect(ga.canApprove).toHaveLength(0)
    expect(ga.canTriggerReview).toBe(false)
    expect(ga.canOverrideGate).toBe(false)
  })

  it('operations can trigger review but NOT override gates', () => {
    const ga = getGateAuthority('operations')
    expect(ga.canTriggerReview).toBe(true)
    expect(ga.canOverrideGate).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 11. getAllowedAgents()
// ---------------------------------------------------------------------------

describe('getAllowedAgents()', () => {
  it('executive has all agents', () => {
    const agents = getAllowedAgents('executive')
    expect(agents).toContain('capture')
    expect(agents).toContain('strategy')
    expect(agents).toContain('blackhat')
    expect(agents).toContain('writer')
    expect(agents.length).toBeGreaterThanOrEqual(8)
  })

  it('partner only has writer agent', () => {
    const agents = getAllowedAgents('partner')
    expect(agents).toEqual(['writer'])
  })

  it('author has writer and compliance agents', () => {
    const agents = getAllowedAgents('author')
    expect(agents).toContain('writer')
    expect(agents).toContain('compliance')
    expect(agents).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// 12. Tier-aware module visibility
// ---------------------------------------------------------------------------

describe('getTierVisibleModules()', () => {
  it('starter tier has 8 core modules', () => {
    const modules = getTierVisibleModules('starter')
    expect(modules).toHaveLength(8)
    expect(modules).toContain('dashboard')
    expect(modules).toContain('proposals')
    expect(modules).not.toContain('analytics')
    expect(modules).not.toContain('admin')
  })

  it('professional tier has 12 modules', () => {
    const modules = getTierVisibleModules('professional')
    expect(modules).toHaveLength(12)
    expect(modules).toContain('analytics')
    expect(modules).toContain('strategy')
    expect(modules).not.toContain('admin')
  })

  it('enterprise tier has all modules', () => {
    const modules = getTierVisibleModules('enterprise')
    expect(modules).toHaveLength(ALL_MODULES.length)
    expect(modules).toContain('admin')
    expect(modules).toContain('audit_log')
  })

  it('unknown tier falls back to starter', () => {
    const modules = getTierVisibleModules('unknown_tier')
    expect(modules).toEqual(getTierVisibleModules('starter'))
  })
})

describe('filterPermissionsByTier()', () => {
  it('disables shouldRender for modules outside the tier', () => {
    const perms = getRolePermissions('executive')
    const filtered = filterPermissionsByTier(perms, 'starter')

    // Admin is not in starter tier, should have shouldRender=false
    expect(filtered['admin'].shouldRender).toBe(false)
    // Analytics is not in starter tier
    expect(filtered['analytics'].shouldRender).toBe(false)
    // Dashboard is in starter tier, should keep original value
    expect(filtered['dashboard'].shouldRender).toBe(true)
  })

  it('preserves canView/canEdit even when shouldRender is disabled by tier', () => {
    const perms = getRolePermissions('executive')
    const filtered = filterPermissionsByTier(perms, 'starter')

    // Admin module gets shouldRender forced to false, but canView/canEdit preserved
    expect(filtered['admin'].shouldRender).toBe(false)
    expect(filtered['admin'].canView).toBe(true)
    expect(filtered['admin'].canEdit).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 13. Config integrity — verify test expectations match the JSON source
// ---------------------------------------------------------------------------

describe('Config integrity', () => {
  it('config version is 9.5', () => {
    expect(rbacConfig.version).toBe('9.5')
  })

  it('config has exactly 12 roles', () => {
    expect(Object.keys(rbacConfig.roles)).toHaveLength(12)
  })

  it('every role in ALL_ROLES exists in the JSON config', () => {
    for (const role of ALL_ROLES) {
      expect(rbacConfig.roles).toHaveProperty(role)
    }
  })

  it('getRoleConfig returns non-null for all valid roles', () => {
    for (const role of ALL_ROLES) {
      expect(getRoleConfig(role), `getRoleConfig("${role}") should not be null`).not.toBeNull()
    }
  })
})
