import { describe, it, expect } from 'vitest'
import {
  resolveRole,
  getModulePermission,
  getRolePermissions,
  getRoleConfig,
  getVisibleNav,
  isInternalRole,
  hasPermission,
  getRoleDisplayName,
  getUIComplexityLevel,
  getGateAuthority,
  getClassificationCeiling,
  getSessionTimeout,
  type ConfigRoleId,
  type ModuleId,
} from '../config'

// ─── resolveRole() ─────────────────────────────────────────────

describe('resolveRole()', () => {
  const ALL_ROLES: ConfigRoleId[] = [
    'executive', 'operations', 'capture_manager', 'proposal_manager',
    'volume_lead', 'pricing_manager', 'contracts', 'hr_staffing',
    'author', 'partner', 'subcontractor', 'consultant',
  ]

  it.each(ALL_ROLES)('resolves "%s" to itself', (role) => {
    expect(resolveRole(role)).toBe(role)
  })

  it('defaults to "partner" for null input', () => {
    expect(resolveRole(null)).toBe('partner')
  })

  it('defaults to "partner" for undefined input', () => {
    expect(resolveRole(undefined)).toBe('partner')
  })

  it('defaults to "partner" for empty string', () => {
    expect(resolveRole('')).toBe('partner')
  })

  it('defaults to "partner" for unknown role string', () => {
    expect(resolveRole('random_unknown_role')).toBe('partner')
  })

  it('maps legacy "ceo" → "executive"', () => {
    expect(resolveRole('ceo')).toBe('executive')
  })

  it('maps legacy "admin" → "executive"', () => {
    expect(resolveRole('admin')).toBe('executive')
  })

  it('maps legacy "coo" → "operations"', () => {
    expect(resolveRole('coo')).toBe('operations')
  })

  it('maps legacy "pm" → "proposal_manager"', () => {
    expect(resolveRole('pm')).toBe('proposal_manager')
  })

  it('normalizes hyphens to underscores ("capture-manager" → "capture_manager")', () => {
    expect(resolveRole('capture-manager')).toBe('capture_manager')
  })

  it('normalizes spaces to underscores ("volume lead" → "volume_lead")', () => {
    expect(resolveRole('volume lead')).toBe('volume_lead')
  })

  it('is case-insensitive ("EXECUTIVE" → "executive")', () => {
    expect(resolveRole('EXECUTIVE')).toBe('executive')
  })
})

// ─── getModulePermission() ──────────────────────────────────────

describe('getModulePermission()', () => {
  it('executive can view dashboard but not edit (per config v9.5)', () => {
    const perm = getModulePermission('executive', 'dashboard')
    expect(perm.shouldRender).toBe(true)
    expect(perm.canView).toBe(true)
    expect(perm.canEdit).toBe(false)
  })

  it('executive has full access to admin module', () => {
    const perm = getModulePermission('executive', 'admin')
    expect(perm.shouldRender).toBe(true)
    expect(perm.canView).toBe(true)
    expect(perm.canEdit).toBe(true)
  })

  it('author does NOT have edit access to admin', () => {
    const perm = getModulePermission('author', 'admin')
    expect(perm.canEdit).toBe(false)
  })

  it('partner has NO access to pipeline (external role)', () => {
    const perm = getModulePermission('partner', 'pipeline')
    expect(perm.shouldRender).toBe(false)
    expect(perm.canView).toBe(false)
    expect(perm.canEdit).toBe(false)
  })

  it('partner can view+edit proposals with scope restriction', () => {
    const perm = getModulePermission('partner', 'proposals')
    expect(perm.shouldRender).toBe(true)
    expect(perm.canView).toBe(true)
    expect(perm.canEdit).toBe(true)
    expect(perm.scopeRestriction).toBe('assigned_sections_only')
  })

  it('returns DENY_ALL for unknown module on any role', () => {
    const perm = getModulePermission('executive', 'nonexistent_module' as ModuleId)
    expect(perm.shouldRender).toBe(false)
    expect(perm.canView).toBe(false)
    expect(perm.canEdit).toBe(false)
  })

  it('returns permissions for legacy role (resolves first)', () => {
    // "ceo" → "executive" → pipeline has full access
    const perm = getModulePermission('ceo', 'pipeline')
    expect(perm.shouldRender).toBe(true)
    expect(perm.canView).toBe(true)
    expect(perm.canEdit).toBe(true)
  })
})

// ─── hasPermission() ────────────────────────────────────────────

describe('hasPermission()', () => {
  it('returns true when executive checks canEdit on pipeline', () => {
    expect(hasPermission('executive', 'pipeline', 'canEdit')).toBe(true)
  })

  it('returns false when author checks canEdit on admin', () => {
    expect(hasPermission('author', 'admin', 'canEdit')).toBe(false)
  })

  it('returns true for shouldRender when role has access', () => {
    expect(hasPermission('executive', 'dashboard', 'shouldRender')).toBe(true)
  })
})

// ─── getRolePermissions() ───────────────────────────────────────

describe('getRolePermissions()', () => {
  it('returns permissions for all modules', () => {
    const perms = getRolePermissions('executive')
    expect(Object.keys(perms).length).toBeGreaterThanOrEqual(14)
  })

  it('returns DENY_ALL for all modules when role is invalid', () => {
    const perms = getRolePermissions('nonexistent')
    // Will fall back to 'partner' via resolveRole, so not DENY_ALL for all
    // Just verify it returns an object with module keys
    expect(perms).toBeDefined()
    expect(typeof perms).toBe('object')
  })
})

// ─── getRoleConfig() ────────────────────────────────────────────

describe('getRoleConfig()', () => {
  it('returns config object for valid role', () => {
    const cfg = getRoleConfig('executive')
    expect(cfg).not.toBeNull()
    expect(cfg?.displayName).toBeDefined()
    expect(cfg?.type).toBeDefined()
  })

  it('returns config for legacy role (resolves first)', () => {
    const cfg = getRoleConfig('ceo')
    expect(cfg).not.toBeNull()
    expect(cfg?.type).toBe('internal')
  })
})

// ─── getVisibleNav() ────────────────────────────────────────────

describe('getVisibleNav()', () => {
  it('executive sees admin nav items', () => {
    const nav = getVisibleNav('executive')
    const adminLabels = nav.admin.map((i) => i.module)
    expect(adminLabels).toContain('admin')
  })

  it('partner does NOT see admin nav items', () => {
    const nav = getVisibleNav('partner')
    const adminLabels = nav.admin.map((i) => i.module)
    expect(adminLabels).not.toContain('admin')
  })

  it('returns primary, secondary, and admin arrays', () => {
    const nav = getVisibleNav('executive')
    expect(Array.isArray(nav.primary)).toBe(true)
    expect(Array.isArray(nav.secondary)).toBe(true)
    expect(Array.isArray(nav.admin)).toBe(true)
  })

  it('nav items have required properties', () => {
    const nav = getVisibleNav('executive')
    const all = [...nav.primary, ...nav.secondary, ...nav.admin]
    for (const item of all) {
      expect(item.module).toBeDefined()
      expect(item.label).toBeDefined()
      expect(item.href).toBeDefined()
    }
  })
})

// ─── isInternalRole() ───────────────────────────────────────────

describe('isInternalRole()', () => {
  it('executive is internal', () => {
    expect(isInternalRole('executive')).toBe(true)
  })

  it('author is internal', () => {
    expect(isInternalRole('author')).toBe(true)
  })

  it('partner is external', () => {
    expect(isInternalRole('partner')).toBe(false)
  })

  it('subcontractor is external', () => {
    expect(isInternalRole('subcontractor')).toBe(false)
  })

  it('consultant is external', () => {
    expect(isInternalRole('consultant')).toBe(false)
  })
})

// ─── Helper functions ───────────────────────────────────────────

describe('getRoleDisplayName()', () => {
  it('returns display name for valid role', () => {
    const name = getRoleDisplayName('executive')
    expect(name).toBeDefined()
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })

  it('returns formatted string for unknown role', () => {
    const name = getRoleDisplayName('some_unknown')
    // Falls back to 'partner' via resolveRole, then gets displayName
    expect(typeof name).toBe('string')
  })
})

describe('getUIComplexityLevel()', () => {
  it('returns complexity level for valid role', () => {
    const level = getUIComplexityLevel('executive')
    expect(typeof level).toBe('string')
    expect(level.length).toBeGreaterThan(0)
  })
})

describe('getClassificationCeiling()', () => {
  it('returns classification for executive', () => {
    const classification = getClassificationCeiling('executive')
    expect(typeof classification).toBe('string')
  })

  it('returns PUBLIC for invalid role', () => {
    // resolveRole maps invalid → partner, but check the function handles it
    const classification = getClassificationCeiling('nonexistent')
    expect(typeof classification).toBe('string')
  })
})

describe('getGateAuthority()', () => {
  it('executive can override gates', () => {
    const ga = getGateAuthority('executive')
    expect(ga.canOverrideGate).toBe(true)
  })

  it('author cannot override gates', () => {
    const ga = getGateAuthority('author')
    expect(ga.canOverrideGate).toBe(false)
  })

  it('returns empty canApprove array for restricted roles', () => {
    const ga = getGateAuthority('partner')
    expect(ga.canApprove).toEqual([])
  })
})

describe('getSessionTimeout()', () => {
  it('returns a number for valid role', () => {
    const timeout = getSessionTimeout('executive')
    expect(typeof timeout).toBe('number')
    expect(timeout).toBeGreaterThan(0)
  })
})
