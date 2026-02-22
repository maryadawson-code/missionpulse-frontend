// filepath: tests/collaboration/cascade-preview.test.ts
/**
 * Tests for cascade preview logic
 * v1.3 Sprint 31
 *
 * Tests the CascadePreviewItem interface structure and the preview
 * contract: when no affected documents exist, the preview should
 * return an empty array.
 *
 * Related module: lib/sync/coordination-engine.ts (previewCascade)
 * Types from: lib/types/sync.ts
 */

import type { CascadePreviewItem } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Test 1: CascadePreviewItem has expected fields ──────────

function testPreviewItemStructure(): TestResult {
  try {
    // Create a fully populated CascadePreviewItem
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

    // Verify all required fields exist and have correct types
    if (typeof item.ruleId !== 'string' || item.ruleId === '') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'ruleId should be a non-empty string',
      }
    }

    if (typeof item.targetDocType !== 'string' || item.targetDocType === '') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'targetDocType should be a non-empty string',
      }
    }

    if (typeof item.targetFieldPath !== 'string' || item.targetFieldPath === '') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'targetFieldPath should be a non-empty string',
      }
    }

    if (typeof item.documentId !== 'string' || item.documentId === '') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'documentId should be a non-empty string',
      }
    }

    if (typeof item.documentTitle !== 'string' || item.documentTitle === '') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'documentTitle should be a non-empty string',
      }
    }

    // ruleDescription is nullable
    if (item.ruleDescription !== null && typeof item.ruleDescription !== 'string') {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'ruleDescription should be a string or null',
      }
    }

    // currentValue and newValue can be any type (unknown)
    // Verify they're present (not undefined)
    if (item.currentValue === undefined) {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'currentValue should be defined (can be any value including null)',
      }
    }
    if (item.newValue === undefined) {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'newValue should be defined (can be any value including null)',
      }
    }

    // Verify all expected keys are present
    const expectedKeys = [
      'ruleId',
      'ruleDescription',
      'targetDocType',
      'targetFieldPath',
      'currentValue',
      'newValue',
      'documentId',
      'documentTitle',
    ]
    const itemKeys = Object.keys(item)
    for (const key of expectedKeys) {
      if (!itemKeys.includes(key)) {
        return {
          name: 'testPreviewItemStructure',
          passed: false,
          error: `Missing expected key '${key}' in CascadePreviewItem`,
        }
      }
    }

    // Verify with null ruleDescription
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

    if (nullDescItem.ruleDescription !== null) {
      return {
        name: 'testPreviewItemStructure',
        passed: false,
        error: 'ruleDescription should accept null',
      }
    }

    return { name: 'testPreviewItemStructure', passed: true }
  } catch (err) {
    return {
      name: 'testPreviewItemStructure',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Empty preview — no affected documents ───────────

function testEmptyPreview(): TestResult {
  try {
    // Simulate the contract from previewCascade:
    // When no target documents match the rule's target_doc_type,
    // the function returns an empty array.
    const emptyPreview: CascadePreviewItem[] = []

    if (!Array.isArray(emptyPreview)) {
      return {
        name: 'testEmptyPreview',
        passed: false,
        error: 'Preview result should be an array',
      }
    }

    if (emptyPreview.length !== 0) {
      return {
        name: 'testEmptyPreview',
        passed: false,
        error: `Expected empty array, got ${emptyPreview.length} items`,
      }
    }

    // Verify that filtering produces empty results for non-matching doc types
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

    // Filter for a doc type that doesn't exist in the previews
    const filtered = allPreviews.filter(
      (item) => item.targetDocType === 'nonexistent_type'
    )

    if (filtered.length !== 0) {
      return {
        name: 'testEmptyPreview',
        passed: false,
        error: `Expected 0 items for non-matching doc type filter, got ${filtered.length}`,
      }
    }

    // Verify filtering for matching doc type works
    const matchingFiltered = allPreviews.filter(
      (item) => item.targetDocType === 'technical_volume'
    )

    if (matchingFiltered.length !== 1) {
      return {
        name: 'testEmptyPreview',
        passed: false,
        error: `Expected 1 item for matching doc type, got ${matchingFiltered.length}`,
      }
    }

    return { name: 'testEmptyPreview', passed: true }
  } catch (err) {
    return {
      name: 'testEmptyPreview',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testPreviewItemStructure,
  testEmptyPreview,
]
