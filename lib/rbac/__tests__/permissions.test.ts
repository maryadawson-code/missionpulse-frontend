// filepath: lib/rbac/__tests__/permissions.test.ts
/**
 * Role × Module permission matrix spot-checks.
 * Validates fail-closed defaults, internal/external boundaries,
 * and the invisible RBAC contract.
 * v1.6 T-43.2
 */
import { describe, it, expect } from 'vitest'
import {
  getModulePermission,
  isInternalRole,
  hasForceCUIWatermark,
  getClassificationCeiling,
  getSessionTimeout,
  getAllowedAgents,
  getGateAuthority,
  resolveRole,
  type ModuleId,
} from '../config'

// ─── Internal vs External boundary ──────────────────────────────

describe('internal/external role boundary', () => {
  const INTERNAL_ROLES = [
    'executive', 'operations', 'capture_manager', 'proposal_manager',
    'volume_lead', 'pricing_manager', 'contracts', 'hr_staffing', 'author',
  ]
  const EXTERNAL_ROLES = ['partner', 'subcontractor', 'consultant']

  it.each(INTERNAL_ROLES)('%s is classified as internal', (role) => {
    expect(isInternalRole(role)).toBe(true)
  })

  it.each(EXTERNAL_ROLES)('%s is classified as external', (role) => {
    expect(isInternalRole(role)).toBe(false)
  })

  it.each(EXTERNAL_ROLES)('%s cannot access admin module', (role) => {
    const perm = getModulePermission(role, 'admin')
    expect(perm.shouldRender).toBe(false)
    expect(perm.canView).toBe(false)
    expect(perm.canEdit).toBe(false)
  })

  it.each(EXTERNAL_ROLES)('%s cannot access pipeline', (role) => {
    const perm = getModulePermission(role, 'pipeline')
    expect(perm.shouldRender).toBe(false)
  })
})

// ─── CUI watermark enforcement ──────────────────────────────────

describe('CUI watermark enforcement', () => {
  it('executive does NOT have forced CUI watermark', () => {
    expect(hasForceCUIWatermark('executive')).toBe(false)
  })

  it('partner HAS forced CUI watermark', () => {
    expect(hasForceCUIWatermark('partner')).toBe(true)
  })

  it('subcontractor HAS forced CUI watermark', () => {
    expect(hasForceCUIWatermark('subcontractor')).toBe(true)
  })
})

// ─── Classification ceiling ─────────────────────────────────────

describe('classification ceiling', () => {
  it('executive has CUI ceiling', () => {
    const ceiling = getClassificationCeiling('executive')
    expect(ceiling).toContain('CUI')
  })

  it('partner is restricted to PUBLIC', () => {
    expect(getClassificationCeiling('partner')).toBe('PUBLIC')
  })
})

// ─── Session timeout ────────────────────────────────────────────

describe('session timeout', () => {
  it('executive has 8-hour timeout (28800s)', () => {
    expect(getSessionTimeout('executive')).toBe(28800)
  })

  it('partner has 1-hour timeout (3600s)', () => {
    expect(getSessionTimeout('partner')).toBe(3600)
  })

  it('external roles have shorter timeouts than internal', () => {
    const execTimeout = getSessionTimeout('executive')
    const partnerTimeout = getSessionTimeout('partner')
    expect(partnerTimeout).toBeLessThan(execTimeout)
  })
})

// ─── Gate authority ─────────────────────────────────────────────

describe('gate authority', () => {
  it('executive can approve gates and override', () => {
    const ga = getGateAuthority('executive')
    expect(ga.canApprove.length).toBeGreaterThan(0)
    expect(ga.canTriggerReview).toBe(true)
    expect(ga.canOverrideGate).toBe(true)
  })

  it('partner has no gate authority', () => {
    const ga = getGateAuthority('partner')
    expect(ga.canApprove).toEqual([])
    expect(ga.canTriggerReview).toBe(false)
    expect(ga.canOverrideGate).toBe(false)
  })
})

// ─── AI agent access ────────────────────────────────────────────

describe('AI agent access', () => {
  it('executive has all 8 AI agents', () => {
    const agents = getAllowedAgents('executive')
    expect(agents).toHaveLength(8)
    expect(agents).toContain('capture')
    expect(agents).toContain('strategy')
  })

  it('partner has limited or no AI agents', () => {
    const agents = getAllowedAgents('partner')
    expect(agents.length).toBeLessThanOrEqual(2)
  })
})

// ─── Fail-closed unknown inputs ─────────────────────────────────

describe('fail-closed for unknown inputs', () => {
  it('unknown role resolves to partner (most restrictive)', () => {
    expect(resolveRole('hacker')).toBe('partner')
    expect(resolveRole('DROP TABLE')).toBe('partner')
  })

  it('unknown module returns DENY_ALL', () => {
    const perm = getModulePermission('executive', 'fake_module' as ModuleId)
    expect(perm.shouldRender).toBe(false)
    expect(perm.canView).toBe(false)
    expect(perm.canEdit).toBe(false)
  })

  it('SQL injection in role string resolves safely', () => {
    const role = resolveRole("'; DROP TABLE profiles; --")
    expect(role).toBe('partner')
    const perm = getModulePermission("'; DROP TABLE profiles; --", 'admin')
    expect(perm.shouldRender).toBe(false)
  })
})
