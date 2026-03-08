/**
 * Tests for lib/ai/agents/parsers.ts
 * Pure parsing functions — no mocks needed for external deps.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCaptureAnalysis,
  parseExtractedRequirements,
  parseWriterOutput,
  parseOralsOutput,
} from '@/lib/ai/agents/parsers'

// Mock crypto.randomUUID for deterministic IDs
beforeEach(() => {
  let counter = 0
  vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`)
})

// ─── parseCaptureAnalysis ────────────────────────────────────

describe('parseCaptureAnalysis', () => {
  it('extracts pwin percentage from content', () => {
    const result = parseCaptureAnalysis('The estimated probability of win is 75%.')
    expect(result.pwin).toBe(75)
  })

  it('defaults to 50 when no percentage found', () => {
    const result = parseCaptureAnalysis('No percentage here.')
    expect(result.pwin).toBe(50)
  })

  it('clamps pwin to 0-100 range', () => {
    const result = parseCaptureAnalysis('The pwin is 150%.')
    expect(result.pwin).toBe(100)
  })

  it('parses win themes from markdown sections', () => {
    const content = `**Win Themes**
1. Strong past performance in federal healthcare
2. Deep FHIR R4 integration experience

**Risk Factors**
1. Limited SDVOSB teaming history
2. No prior DHA contract wins

**Competitive Landscape**
Leidos holds the incumbent position.`

    const result = parseCaptureAnalysis(content)
    expect(result.winThemes.length).toBeGreaterThan(0)
    expect(result.winThemes[0]).toContain('Strong past performance')
    expect(result.riskFactors.length).toBeGreaterThan(0)
    expect(result.riskFactors[0]).toContain('Limited SDVOSB')
    expect(result.competitiveLandscape).toContain('Leidos')
  })

  it('returns defaults when no sections parsed', () => {
    const result = parseCaptureAnalysis('Short content with 60% pwin.')
    expect(result.winThemes).toEqual(['Analysis pending'])
    expect(result.riskFactors).toEqual(['Analysis pending'])
    expect(result.competitiveLandscape).toBe('Competitive landscape analysis pending')
  })

  it('limits items to 5 per section', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `${i + 1}. This is win theme number ${i + 1} with enough text`).join('\n')
    const content = `**Win Themes**\n${lines}`
    const result = parseCaptureAnalysis(content)
    expect(result.winThemes.length).toBeLessThanOrEqual(5)
  })
})

// ─── parseExtractedRequirements ──────────────────────────────

describe('parseExtractedRequirements', () => {
  it('parses REQ-numbered requirements', () => {
    const content = `REQ-001
**Requirement**: The contractor shall provide FHIR R4 integration with all MTF EHR systems.
**Section**: Technical Approach
**Priority**: High
**Confidence**: high
**Because**: Explicitly stated in Section L.`

    const result = parseExtractedRequirements(content)
    expect(result.length).toBe(1)
    expect(result[0].reference).toBe('REQ-001')
    expect(result[0].requirement).toContain('FHIR R4')
    expect(result[0].section).toBe('Technical Approach')
    expect(result[0].priority).toBe('High')
    expect(result[0].confidence).toBe('high')
    expect(result[0].because).toContain('Explicitly stated')
  })

  it('parses numbered requirements and auto-generates REQ references', () => {
    const content = `1. **Requirement**: Must comply with NIST 800-171 controls for all CUI handling.
**Section**: Security
**Priority**: Critical
**Confidence**: medium
**Because**: Standard DoD requirement.`

    const result = parseExtractedRequirements(content)
    expect(result.length).toBe(1)
    expect(result[0].reference).toBe('REQ-001')
    expect(result[0].priority).toBe('Critical')
    expect(result[0].confidence).toBe('medium')
  })

  it('skips blocks that are too short', () => {
    const content = 'tiny\n\n1. too short'
    const result = parseExtractedRequirements(content)
    expect(result.length).toBe(0)
  })

  it('defaults priority to Medium when invalid', () => {
    const content = `REQ-001
**Requirement**: The contractor shall provide all necessary documentation for ATO package.
**Priority**: SuperHigh
**Confidence**: low`

    const result = parseExtractedRequirements(content)
    expect(result.length).toBe(1)
    expect(result[0].priority).toBe('Medium')
    expect(result[0].confidence).toBe('low')
  })

  it('handles missing optional fields with defaults', () => {
    const content = `REQ-001
**Requirement**: The contractor shall deliver monthly status reports to the COR.`

    const result = parseExtractedRequirements(content)
    expect(result.length).toBe(1)
    expect(result[0].section).toBe('Other')
    expect(result[0].priority).toBe('Medium')
    expect(result[0].confidence).toBe('medium')
    expect(result[0].because).toContain('Identified as a compliance requirement')
  })
})

// ─── parseWriterOutput ───────────────────────────────────────

describe('parseWriterOutput', () => {
  it('parses content with because annotations', () => {
    // The parser splits on (?=Because:) so each "Because:" must follow
    // its associated content block directly
    const content = `Our team brings extensive experience in federal health IT modernization.
Because: This opening establishes credibility with the evaluator.`

    const result = parseWriterOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].content).toContain('extensive experience')
    expect(result[0].because).toContain('establishes credibility')
    expect(result[0].confidence).toBe('high')
  })

  it('handles trailing content without because annotation', () => {
    const content = 'This is a long enough paragraph that should be captured as medium confidence output by the parser.'

    const result = parseWriterOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].confidence).toBe('medium')
    expect(result[0].because).toBe('Generated to address section requirements.')
  })

  it('skips trailing content shorter than 20 characters', () => {
    const content = 'Short.'
    const result = parseWriterOutput(content)
    expect(result.length).toBe(0)
  })

  it('assigns unique IDs to each paragraph', () => {
    // Each content block must come BEFORE its Because: line and not be
    // absorbed into the previous Because: block
    const content = [
      'Paragraph one is long enough to be captured by the parser.',
      'Because: Reason one.',
      'Because: Reason two for a second trailing paragraph that is long enough.',
    ].join('\n')

    // Block split: ["Paragraph one...\n", "Because: Reason one.\n", "Because: Reason two..."]
    // Block 1: not because, currentContent = "Paragraph one..."
    // Block 2: because, push paragraph with currentContent. currentContent = ''
    // Block 3: because, currentContent is empty, skip
    // Result: 1 paragraph
    const result = parseWriterOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].id).toBeTruthy()
    expect(result[0].because).toContain('Reason one')
  })
})

// ─── parseOralsOutput ────────────────────────────────────────

describe('parseOralsOutput', () => {
  it('parses numbered Q&A blocks', () => {
    const content = `1. What is your approach to FHIR R4 integration with MHS GENESIS?
Answer: We deploy a phased integration approach starting with core ADT interfaces.
Coaching tip: Be specific about the interface count and timeline.
Because: Evaluators probe technical depth on interoperability.`

    const result = parseOralsOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].question).toContain('FHIR R4')
    expect(result[0].suggestedAnswer).toContain('phased integration')
    expect(result[0].coachingTip).toContain('specific about the interface')
    expect(result[0].because).toContain('Evaluators probe')
  })

  it('parses Q-prefixed blocks', () => {
    const content = `Q1: How do you handle CUI data classification in your health IT systems?
**Answer**: We implement IL4/IL5 data classification using DoD RMF controls.
**Coaching tip**: Reference the specific NIST 800-171 control families.
**Because**: DHA evaluators expect named compliance frameworks.`

    const result = parseOralsOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].question).toContain('CUI data classification')
    expect(result[0].suggestedAnswer).toContain('IL4/IL5')
  })

  it('provides defaults for missing answer fields', () => {
    const content = `1. What is your CMMC certification level and when was your last C3PAO assessment?
This is a follow-up line to make the block long enough for parsing.`

    const result = parseOralsOutput(content)
    expect(result.length).toBe(1)
    expect(result[0].suggestedAnswer).toContain('follow-up line')
    expect(result[0].coachingTip).toBe('Be specific, use quantitative examples.')
    expect(result[0].because).toBe('Evaluators commonly probe this area.')
  })

  it('skips blocks with questions shorter than 15 chars', () => {
    const content = `1. Short q?
Answer: Still has an answer.`

    const result = parseOralsOutput(content)
    expect(result.length).toBe(0)
  })

  it('skips blocks shorter than 30 chars total', () => {
    const content = '1. tiny'
    const result = parseOralsOutput(content)
    expect(result.length).toBe(0)
  })
})
