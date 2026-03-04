/**
 * AI Classification + Routing Tests.
 *
 * Tests classification rules (pure regex), priority resolution,
 * and the classification router's content scanning logic.
 */
import { describe, it, expect } from 'vitest'
import {
  CLASSIFICATION_RULES,
  getHighestClassification,
} from '../classification-rules'

// ─── Classification Rules ──────────────────────────────────────

describe('CLASSIFICATION_RULES', () => {
  it('detects CUI marking', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.level === 'CUI' && r.pattern.test('This document is CUI')
    )
    expect(match).toBeDefined()
  })

  it('detects CUI//SP-PROPIN marking', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.level === 'CUI//SP-PROPIN' && r.pattern.test('CUI//SP-PROPIN data')
    )
    expect(match).toBeDefined()
  })

  it('detects OPSEC marking', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.level === 'OPSEC' && r.pattern.test('This is OPSEC controlled')
    )
    expect(match).toBeDefined()
  })

  it('detects FOUO (For Official Use Only)', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('FOR OFFICIAL USE ONLY')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI')
  })

  it('detects SBU (Sensitive But Unclassified)', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('SENSITIVE BUT UNCLASSIFIED')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI')
  })

  it('detects SSN pattern (###-##-####)', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('SSN: 123-45-6789')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI')
  })

  it('detects proprietary marking', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('PROPRIETARY information')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI//SP-PROPIN')
  })

  it('detects trade secret marking', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('This is a TRADE SECRET')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI//SP-PROPIN')
  })

  it('detects wrap rate / pricing data', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('Our wrap rate is 2.5x')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI//SP-PROPIN')
  })

  it('detects security clearance references (TS/SCI)', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('Requires TS/SCI clearance')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('OPSEC')
  })

  it('does NOT match plain unclassified text', () => {
    const text = 'Here is a normal proposal with no sensitive markings'
    const matches = CLASSIFICATION_RULES.filter((r) => r.pattern.test(text))
    expect(matches.length).toBe(0)
  })

  it('detects BOE (Basis of Estimate)', () => {
    const match = CLASSIFICATION_RULES.find(
      (r) => r.pattern.test('See the BOE for cost details')
    )
    expect(match).toBeDefined()
    expect(match?.level).toBe('CUI//SP-PROPIN')
  })
})

// ─── getHighestClassification() ─────────────────────────────────

describe('getHighestClassification()', () => {
  it('OPSEC is highest priority', () => {
    expect(getHighestClassification(['CUI', 'OPSEC', 'CUI//SP-PROPIN'])).toBe('OPSEC')
  })

  it('CUI//SP-PROPIN outranks CUI', () => {
    expect(getHighestClassification(['CUI', 'CUI//SP-PROPIN'])).toBe('CUI//SP-PROPIN')
  })

  it('single CUI returns CUI', () => {
    expect(getHighestClassification(['CUI'])).toBe('CUI')
  })

  it('single OPSEC returns OPSEC', () => {
    expect(getHighestClassification(['OPSEC'])).toBe('OPSEC')
  })

  it('duplicate levels return highest', () => {
    expect(getHighestClassification(['CUI', 'CUI', 'CUI//SP-PROPIN'])).toBe('CUI//SP-PROPIN')
  })
})

// ─── Content scanning simulation ────────────────────────────────

describe('Content classification scanning', () => {
  function classifyContent(text: string): 'UNCLASSIFIED' | 'CUI' | 'CUI//SP-PROPIN' | 'OPSEC' {
    const matches = CLASSIFICATION_RULES.filter((r) => r.pattern.test(text))
    if (matches.length === 0) return 'UNCLASSIFIED'
    return getHighestClassification(matches.map((m) => m.level))
  }

  it('classifies normal proposal as UNCLASSIFIED', () => {
    expect(classifyContent('Write a technical approach for cloud migration')).toBe('UNCLASSIFIED')
  })

  it('classifies content with CUI marking as CUI', () => {
    expect(classifyContent('This proposal contains CUI data about defense systems')).toBe('CUI')
  })

  it('classifies content with OPSEC marking as OPSEC', () => {
    expect(classifyContent('OPSEC analysis of adversary capabilities')).toBe('OPSEC')
  })

  it('classifies mixed content to highest level', () => {
    const content = 'CUI proposal with PROPRIETARY wrap rate data and OPSEC clearance'
    expect(classifyContent(content)).toBe('OPSEC')
  })

  it('classifies SSN-containing content as CUI', () => {
    expect(classifyContent('Employee SSN: 123-45-6789')).toBe('CUI')
  })

  it('classifies labor category data as CUI//SP-PROPIN', () => {
    expect(classifyContent('LCAT: Senior Software Engineer')).toBe('CUI//SP-PROPIN')
  })
})
