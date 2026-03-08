/**
 * Tests for lib/agents/health-it-domain-config.ts
 * Verifies all exports are accessible and contain expected content.
 */
import { describe, it, expect } from 'vitest'
import {
  HEALTH_IT_AGENCY_CONTEXT,
  HEALTH_IT_TECHNICAL_STANDARDS,
  PROPOSAL_SPECIFICITY_RULES,
  getAgencyContext,
  getVehicleGuidance,
  WRITER_AGENT_HEALTH_IT_INJECTION,
  COMPLIANCE_AGENT_HEALTH_IT_INJECTION,
  BLACK_HAT_AGENT_HEALTH_IT_INJECTION,
  STRATEGY_AGENT_HEALTH_IT_INJECTION,
  CAPTURE_AGENT_HEALTH_IT_INJECTION,
  PRICING_AGENT_HEALTH_IT_INJECTION,
  ORALS_AGENT_HEALTH_IT_INJECTION,
} from '@/lib/agents/health-it-domain-config'

// ─── HEALTH_IT_AGENCY_CONTEXT ────────────────────────────────

describe('HEALTH_IT_AGENCY_CONTEXT', () => {
  it('has DHA, VA, and CROSSCUTTING keys', () => {
    expect(HEALTH_IT_AGENCY_CONTEXT).toHaveProperty('DHA')
    expect(HEALTH_IT_AGENCY_CONTEXT).toHaveProperty('VA')
    expect(HEALTH_IT_AGENCY_CONTEXT).toHaveProperty('CROSSCUTTING')
  })

  it('DHA has required fields', () => {
    const dha = HEALTH_IT_AGENCY_CONTEXT.DHA
    expect(dha.name).toBe('Defense Health Agency')
    expect(dha.abbreviation).toBe('DHA')
    expect(dha.primaryVehicles).toContain('MHS EITS')
    expect(dha.primaryPlatform).toContain('MHS GENESIS')
    expect(dha.incumbents).toContain('Leidos')
    expect(dha.networkRestructure).toContain('9 regional')
  })

  it('VA has required fields', () => {
    const va = HEALTH_IT_AGENCY_CONTEXT.VA
    expect(va.name).toBe('Department of Veterans Affairs')
    expect(va.primaryVehicles).toContain('T4NG (SDVOSB-only)')
    expect(va.primaryPlatform).toContain('Oracle Health')
    expect(va.complianceRequirements).toContain('42 CFR Part 2')
  })

  it('CROSSCUTTING has contract vehicle landscape', () => {
    const cc = HEALTH_IT_AGENCY_CONTEXT.CROSSCUTTING
    expect(cc.contractVehicleLandscape).toHaveProperty('CIO-SP3')
    expect(cc.contractVehicleLandscape['CIO-SP4']).toContain('CANCELLED')
    expect(cc.contractVehicleLandscape).toHaveProperty('VHA IHT 2.0')
    expect(cc.contractVehicleLandscape).toHaveProperty('HCDS (Health Care Delivery Solutions)')
  })

  it('CROSSCUTTING has current environment and administration risk', () => {
    const cc = HEALTH_IT_AGENCY_CONTEXT.CROSSCUTTING
    expect(cc.currentEnvironment).toContain('DOGE')
    expect(cc.administrationRisk).toContain('recompete risk')
  })
})

// ─── HEALTH_IT_TECHNICAL_STANDARDS ───────────────────────────

describe('HEALTH_IT_TECHNICAL_STANDARDS', () => {
  it('has interoperability, security, and platforms sections', () => {
    expect(HEALTH_IT_TECHNICAL_STANDARDS).toHaveProperty('interoperability')
    expect(HEALTH_IT_TECHNICAL_STANDARDS).toHaveProperty('security')
    expect(HEALTH_IT_TECHNICAL_STANDARDS).toHaveProperty('platforms')
  })

  it('interoperability includes FHIR_R4 with evaluation expectations', () => {
    const fhir = HEALTH_IT_TECHNICAL_STANDARDS.interoperability.FHIR_R4
    expect(fhir.description).toContain('FHIR Release 4')
    expect(fhir.evaluatorExpectation).toContain('Unacceptable')
  })

  it('security includes FedRAMP_20x', () => {
    expect(HEALTH_IT_TECHNICAL_STANDARDS.security).toHaveProperty('FedRAMP_20x')
  })

  it('platforms includes MHS_GENESIS and VistA', () => {
    expect(HEALTH_IT_TECHNICAL_STANDARDS.platforms).toHaveProperty('MHS_GENESIS')
    expect(HEALTH_IT_TECHNICAL_STANDARDS.platforms).toHaveProperty('VistA')
  })
})

// ─── PROPOSAL_SPECIFICITY_RULES ──────────────────────────────

describe('PROPOSAL_SPECIFICITY_RULES', () => {
  it('has antiPatterns, requiresSpecificity, and evaluationKillers', () => {
    expect(PROPOSAL_SPECIFICITY_RULES.antiPatterns.length).toBeGreaterThan(0)
    expect(PROPOSAL_SPECIFICITY_RULES.requiresSpecificity.length).toBeGreaterThan(0)
    expect(PROPOSAL_SPECIFICITY_RULES.evaluationKillers.length).toBeGreaterThan(0)
  })

  it('antiPatterns include network and HCDS patterns', () => {
    const patterns = PROPOSAL_SPECIFICITY_RULES.antiPatterns.join(' ')
    expect(patterns).toContain('Defense Health Network')
    expect(patterns).toContain('Oracle Health')
  })
})

// ─── getAgencyContext ────────────────────────────────────────

describe('getAgencyContext', () => {
  it('returns DHA context', () => {
    const ctx = getAgencyContext('DHA')
    expect(ctx.name).toBe('Defense Health Agency')
  })

  it('returns VA context', () => {
    const ctx = getAgencyContext('VA')
    expect(ctx.name).toBe('Department of Veterans Affairs')
  })

  it('returns CROSSCUTTING context', () => {
    const ctx = getAgencyContext('CROSSCUTTING')
    expect(ctx).toHaveProperty('sharedPlatform')
    expect(ctx).toHaveProperty('fhirMandate')
  })
})

// ─── getVehicleGuidance ──────────────────────────────────────

describe('getVehicleGuidance', () => {
  it('returns guidance for CIO-SP3', () => {
    const guidance = getVehicleGuidance('CIO-SP3')
    expect(guidance).toContain('April 2027')
  })

  it('returns cancelled notice for CIO-SP4', () => {
    const guidance = getVehicleGuidance('CIO-SP4')
    expect(guidance).toContain('CANCELLED')
  })

  it('returns guidance for VHA IHT 2.0', () => {
    const guidance = getVehicleGuidance('VHA IHT 2.0')
    expect(guidance).toContain('$14B')
  })
})

// ─── System Prompt Injections ────────────────────────────────

describe('system prompt injections', () => {
  it('WRITER injection contains FHIR and evaluation killer rules', () => {
    expect(WRITER_AGENT_HEALTH_IT_INJECTION).toContain('FHIR')
    expect(WRITER_AGENT_HEALTH_IT_INJECTION).toContain('MANDATORY SPECIFICITY RULES')
    expect(WRITER_AGENT_HEALTH_IT_INJECTION).toContain('Unacceptable')
  })

  it('COMPLIANCE injection contains 42 CFR Part 2 and FedRAMP 20x', () => {
    expect(COMPLIANCE_AGENT_HEALTH_IT_INJECTION).toContain('42 CFR Part 2')
    expect(COMPLIANCE_AGENT_HEALTH_IT_INJECTION).toContain('FedRAMP 20x')
    expect(COMPLIANCE_AGENT_HEALTH_IT_INJECTION).toContain('CIO-SP4')
  })

  it('BLACK_HAT injection contains pWin modifiers', () => {
    expect(BLACK_HAT_AGENT_HEALTH_IT_INJECTION).toContain('pWin')
    expect(BLACK_HAT_AGENT_HEALTH_IT_INJECTION).toContain('Leidos')
    expect(BLACK_HAT_AGENT_HEALTH_IT_INJECTION).toContain('SDVOSB')
  })

  it('STRATEGY injection contains vehicle selection logic', () => {
    expect(STRATEGY_AGENT_HEALTH_IT_INJECTION).toContain('CONTRACT VEHICLE SELECTION')
    expect(STRATEGY_AGENT_HEALTH_IT_INJECTION).toContain('HCDS')
    expect(STRATEGY_AGENT_HEALTH_IT_INJECTION).toContain('TEAMING STRATEGY')
  })

  it('CAPTURE injection contains HCDS guidance', () => {
    expect(CAPTURE_AGENT_HEALTH_IT_INJECTION).toContain('HCDS CAPTURE GUIDANCE')
    expect(CAPTURE_AGENT_HEALTH_IT_INJECTION).toContain('MANDATORY CAPTURE INTELLIGENCE')
  })

  it('PRICING injection contains LCAT and wrap rate guidance', () => {
    expect(PRICING_AGENT_HEALTH_IT_INJECTION).toContain('LCAT')
    expect(PRICING_AGENT_HEALTH_IT_INJECTION).toContain('WRAP RATE')
    expect(PRICING_AGENT_HEALTH_IT_INJECTION).toContain('CIO-SP4')
  })

  it('ORALS injection contains evaluator question patterns', () => {
    expect(ORALS_AGENT_HEALTH_IT_INJECTION).toContain('DHA EVALUATOR QUESTION PATTERNS')
    expect(ORALS_AGENT_HEALTH_IT_INJECTION).toContain('VA EVALUATOR QUESTION PATTERNS')
    expect(ORALS_AGENT_HEALTH_IT_INJECTION).toContain('CONFIDENCE SCORING')
  })
})
