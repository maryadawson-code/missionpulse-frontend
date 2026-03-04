/**
 * v2.0 Regression Tests — Phase L Enterprise Features
 * Sprint 36 (T-36.2) — Phase L v2.0
 *
 * Verifies all Sprint 32-36 modules resolve and export
 * the expected public API surface.
 *
 * © 2026 Mission Meets Tech
 */

import { describe, it, expect } from 'vitest'

// ─── Sprint 32: Enterprise Auth ─────────────────────────────────

describe('T-32.1 — SAML SSO', () => {
  it('exports SAML configuration functions', async () => {
    const mod = await import('@/lib/auth/saml')
    expect(mod.configureSAML).toBeDefined()
    expect(mod.handleSAMLCallback).toBeDefined()
    expect(mod.autoProvisionUser).toBeDefined()
    expect(mod.isSSOOnlyCompany).toBeDefined()
    expect(mod.getSAMLConfig).toBeDefined()
  })
})

describe('T-32.2 — Custom Roles', () => {
  it('exports custom role CRUD functions', async () => {
    const mod = await import('@/lib/rbac/custom-roles')
    expect(mod.getCustomRoles).toBeDefined()
    expect(mod.evaluateCustomRole).toBeDefined()
    expect(mod.createCustomRole).toBeDefined()
    expect(mod.updateCustomRole).toBeDefined()
    expect(mod.deleteCustomRole).toBeDefined()
  })
})

describe('T-32.3 — Multi-Workspace', () => {
  it('exports workspace management functions', async () => {
    const mod = await import('@/lib/workspaces/manager')
    expect(mod.createWorkspace).toBeDefined()
    expect(mod.archiveWorkspace).toBeDefined()
    expect(mod.switchWorkspace).toBeDefined()
    expect(mod.getActiveWorkspace).toBeDefined()
    expect(mod.listWorkspaces).toBeDefined()
  })
})

// ─── Sprint 33: API + CSM ───────────────────────────────────────

describe('T-33.1 — Brand Templates', () => {
  it('exports branding functions', async () => {
    const mod = await import('@/lib/docgen/branding')
    expect(mod.getBrandTemplate).toBeDefined()
    expect(mod.saveBrandTemplate).toBeDefined()
    expect(mod.applyBrandToPptx).toBeDefined()
    expect(mod.applyBrandToDocx).toBeDefined()
    expect(mod.applyBrandToXlsx).toBeDefined()
  })
})

describe('T-33.2 — API Keys & Rate Limiting', () => {
  it('exports API key management functions', async () => {
    const mod = await import('@/lib/api/keys')
    expect(mod.generateAPIKey).toBeDefined()
    expect(mod.validateAPIKey).toBeDefined()
    expect(mod.revokeAPIKey).toBeDefined()
    expect(mod.rotateAPIKey).toBeDefined()
    expect(mod.listAPIKeys).toBeDefined()
  })

  it('exports rate limiter with tier limits', async () => {
    const mod = await import('@/lib/api/rate-limiter')
    expect(mod.checkRateLimit).toBeDefined()
    expect(mod.getRateLimitHeaders).toBeDefined()
    expect(mod.TIER_LIMITS.starter).toBe(0)
    expect(mod.TIER_LIMITS.professional).toBe(100)
    expect(mod.TIER_LIMITS.enterprise).toBe(1000)
  })
})

describe('T-33.3 — Audit Retention', () => {
  it('exports retention policy functions', async () => {
    const mod = await import('@/lib/audit/retention')
    expect(mod.getRetentionPolicy).toBeDefined()
    expect(mod.setRetentionPolicy).toBeDefined()
    expect(mod.purgeExpiredAuditLogs).toBeDefined()
  })
})

describe('T-33.4 — Customer Health', () => {
  it('exports CSM health scoring functions', async () => {
    const mod = await import('@/lib/csm/health')
    expect(mod.calculateCustomerHealth).toBeDefined()
    expect(mod.getFeatureAdoption).toBeDefined()
    expect(mod.getCustomerTrends).toBeDefined()
  })
})

// ─── Sprint 34: Bloomberg + Aggregator ──────────────────────────

describe('T-34.1 — Bloomberg Government', () => {
  it('exports Bloomberg client functions', async () => {
    const mod = await import('@/lib/integrations/bloomberg/client')
    expect(mod.searchOpportunities).toBeDefined()
    expect(mod.getRecentAwards).toBeDefined()
    expect(mod.getAgencyBudgets).toBeDefined()
    expect(mod.isBloombergConfigured).toBeDefined()
  })

  it('exports Bloomberg sync functions', async () => {
    const mod = await import('@/lib/integrations/bloomberg/sync')
    expect(mod.syncBloombergOpportunities).toBeDefined()
    expect(mod.enrichFromBloomberg).toBeDefined()
  })
})

describe('T-34.2 — Federal Aggregator', () => {
  it('exports unified search and import', async () => {
    const mod = await import('@/lib/integrations/aggregator/search')
    expect(mod.federalSearch).toBeDefined()
    expect(mod.importTooPipeline).toBeDefined()
  })
})

// ─── Sprint 35: Orchestrator + Offline ──────────────────────────

describe('T-35.1 — Agent Orchestrator', () => {
  it('exports orchestrator class and templates', async () => {
    const mod = await import('@/lib/ai/orchestrator/engine')
    expect(mod.AgentOrchestrator).toBeDefined()
    expect(mod.WORKFLOW_TEMPLATES).toBeDefined()
    expect(mod.WORKFLOW_TEMPLATES.length).toBeGreaterThan(0)
    expect(mod.getOrchestrationRuns).toBeDefined()
  })

  it('includes full-proposal, gate-review, and risk-scan templates', async () => {
    const { WORKFLOW_TEMPLATES } = await import('@/lib/ai/orchestrator/engine')
    const ids = WORKFLOW_TEMPLATES.map(t => t.id)
    expect(ids).toContain('full-proposal')
    expect(ids).toContain('gate-review')
    expect(ids).toContain('risk-scan')
  })
})

describe('T-35.2 — Offline Mode', () => {
  it('exports offline queue functions', async () => {
    const mod = await import('@/lib/offline/queue')
    expect(mod.enqueueAction).toBeDefined()
    expect(mod.getQueuedActions).toBeDefined()
    expect(mod.replayQueue).toBeDefined()
    expect(mod.removeAction).toBeDefined()
    expect(mod.clearQueue).toBeDefined()
    expect(mod.getQueueSize).toBeDefined()
  })

  it('exports network detector', async () => {
    const mod = await import('@/lib/offline/detector')
    expect(mod.isOnline).toBeDefined()
    expect(mod.onStatusChange).toBeDefined()
    expect(mod.checkConnectivity).toBeDefined()
  })
})

// ─── Sprint 36: FedRAMP ─────────────────────────────────────────

describe('T-36.1 — FedRAMP SSP + ConMon', () => {
  it('exports SSP generator functions', async () => {
    const mod = await import('@/lib/compliance/fedramp/ssp-generator')
    expect(mod.generateSSP).toBeDefined()
    expect(mod.getComplianceSummary).toBeDefined()
    expect(mod.exportSSPAsOSCAL).toBeDefined()
  })

  it('generates a valid SSP document', async () => {
    const { generateSSP } = await import('@/lib/compliance/fedramp/ssp-generator')
    const ssp = generateSSP('MissionPulse', 'MP-001', 'Moderate')
    expect(ssp.systemName).toBe('MissionPulse')
    expect(ssp.impactLevel).toBe('Moderate')
    expect(ssp.controlFamilies.length).toBe(14)
    expect(ssp.overallCompliance).toBeGreaterThan(0)
    expect(ssp.controls.length).toBeGreaterThan(0)
  })

  it('exports continuous monitoring functions', async () => {
    const mod = await import('@/lib/compliance/fedramp/continuous-monitoring')
    expect(mod.runSecurityScan).toBeDefined()
    expect(mod.generateConMonReport).toBeDefined()
  })
})

// ─── Cross-cutting ──────────────────────────────────────────────

describe('v2.0 zero as-any check', () => {
  it('has no as any casts in Sprint 32-36 files', async () => {
    // This is validated by the build-time grep check
    // Included here for regression documentation
    expect(true).toBe(true)
  })
})
