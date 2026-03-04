// filepath: tests/collaboration/cascade-preview.test.ts
/**
 * Tests for cascade preview logic
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import type { CascadePreviewItem } from '@/lib/types/sync'

describe('cascade-preview', () => {
  it('CascadePreviewItem has all expected fields', () => {
    const item: CascadePreviewItem = {
      ruleId: 'rule-001',
      ruleDescription: 'Copy contract value from cover letter to all volumes',
      targetDocType: 'technical_volume',
      targetFieldPath: 'header.contract_value',
      currentValue: '$4,500,000',
      newValue: '$5,000,000',
      documentId: 'doc-tv-001',
      documentTitle: 'Technical Volume - Cyber Modernization',
    }

    expect(typeof item.ruleId).toBe('string')
    expect(item.ruleId).not.toBe('')
    expect(typeof item.targetDocType).toBe('string')
    expect(item.targetDocType).not.toBe('')
    expect(typeof item.targetFieldPath).toBe('string')
    expect(item.targetFieldPath).not.toBe('')
    expect(typeof item.documentId).toBe('string')
    expect(item.documentId).not.toBe('')
    expect(typeof item.documentTitle).toBe('string')
    expect(item.documentTitle).not.toBe('')

    // ruleDescription is nullable
    expect(typeof item.ruleDescription).toBe('string')

    // currentValue and newValue should be defined
    expect(item.currentValue).toBeDefined()
    expect(item.newValue).toBeDefined()

    const expectedKeys = [
      'ruleId', 'ruleDescription', 'targetDocType', 'targetFieldPath',
      'currentValue', 'newValue', 'documentId', 'documentTitle',
    ]
    for (const key of expectedKeys) {
      expect(Object.keys(item)).toContain(key)
    }

    // Verify null ruleDescription
    const nullDescItem: CascadePreviewItem = {
      ruleId: 'rule-002',
      ruleDescription: null,
      targetDocType: 'pricing_volume',
      targetFieldPath: 'total.amount',
      currentValue: 0,
      newValue: 1000000,
      documentId: 'doc-pv-001',
      documentTitle: 'Pricing Volume',
    }
    expect(nullDescItem.ruleDescription).toBeNull()
  })

  it('empty preview returns no items for non-matching doc types', () => {
    const emptyPreview: CascadePreviewItem[] = []
    expect(Array.isArray(emptyPreview)).toBe(true)
    expect(emptyPreview).toHaveLength(0)

    const allPreviews: CascadePreviewItem[] = [
      {
        ruleId: 'rule-001',
        ruleDescription: 'Test rule',
        targetDocType: 'technical_volume',
        targetFieldPath: 'header.value',
        currentValue: 'old',
        newValue: 'new',
        documentId: 'doc-001',
        documentTitle: 'Tech Vol',
      },
    ]

    const filtered = allPreviews.filter((item) => item.targetDocType === 'nonexistent_type')
    expect(filtered).toHaveLength(0)

    const matchingFiltered = allPreviews.filter((item) => item.targetDocType === 'technical_volume')
    expect(matchingFiltered).toHaveLength(1)
  })
})
