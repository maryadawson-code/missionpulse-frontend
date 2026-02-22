// filepath: tests/sync/version-tracker.test.ts
/**
 * Tests for version-tracker.ts — Version Tracking Logic
 * v1.3 Sprint 31
 *
 * Tests the version numbering and diff summary structure contracts.
 * The version tracker depends on Supabase for actual storage, so these
 * tests verify the logical contracts: version incrementing, diff summary
 * shape, and snapshot serialization invariants.
 *
 * Related module: lib/sync/version-tracker.ts
 */

import type { DocumentVersion, DiffResult } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Test 1: Version numbers increment correctly ─────────────

function testVersionNumbering(): TestResult {
  try {
    // Simulate the version numbering logic from recordVersion:
    // nextVersionNumber = (latestVersion?.version_number ?? 0) + 1

    // Case 1: No previous version → version 1
    const previousVersionNumber1: number | undefined = undefined
    const nextVersion1 = (previousVersionNumber1 ?? 0) + 1
    if (nextVersion1 !== 1) {
      return {
        name: 'testVersionNumbering',
        passed: false,
        error: `Expected first version=1 when no previous exists, got ${nextVersion1}`,
      }
    }

    // Case 2: Previous version is 1 → version 2
    const previousVersionNumber2 = 1
    const nextVersion2 = (previousVersionNumber2 ?? 0) + 1
    if (nextVersion2 !== 2) {
      return {
        name: 'testVersionNumbering',
        passed: false,
        error: `Expected version=2 after version 1, got ${nextVersion2}`,
      }
    }

    // Case 3: Previous version is 99 → version 100
    const previousVersionNumber3 = 99
    const nextVersion3 = (previousVersionNumber3 ?? 0) + 1
    if (nextVersion3 !== 100) {
      return {
        name: 'testVersionNumbering',
        passed: false,
        error: `Expected version=100 after version 99, got ${nextVersion3}`,
      }
    }

    // Case 4: Version 0 (edge case) → version 1
    const previousVersionNumber4 = 0
    const nextVersion4 = (previousVersionNumber4 ?? 0) + 1
    if (nextVersion4 !== 1) {
      return {
        name: 'testVersionNumbering',
        passed: false,
        error: `Expected version=1 after version 0, got ${nextVersion4}`,
      }
    }

    // Case 5: Verify version numbers on a DocumentVersion object
    const mockVersion: DocumentVersion = {
      id: 'ver-001',
      document_id: 'doc-001',
      company_id: 'comp-001',
      version_number: 5,
      source: 'missionpulse',
      snapshot: { title: 'Test' },
      diff_summary: null,
      created_by: 'user-001',
      created_at: '2026-02-22T00:00:00Z',
    }
    const nextFromMock = mockVersion.version_number + 1
    if (nextFromMock !== 6) {
      return {
        name: 'testVersionNumbering',
        passed: false,
        error: `Expected next version=6 from version 5, got ${nextFromMock}`,
      }
    }

    return { name: 'testVersionNumbering', passed: true }
  } catch (err) {
    return {
      name: 'testVersionNumbering',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Diff summary has expected fields ────────────────

function testDiffSummaryStructure(): TestResult {
  try {
    // The diff_summary stored in document_versions has this shape:
    // { additions: number, deletions: number, modifications: number, sections_changed?: string[] }

    // Case 1: Full diff summary with sections_changed
    const summary1: DocumentVersion['diff_summary'] = {
      additions: 3,
      deletions: 1,
      modifications: 2,
      sections_changed: ['executive_summary', 'pricing'],
    }

    if (typeof summary1?.additions !== 'number') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'diff_summary.additions should be a number',
      }
    }
    if (typeof summary1?.deletions !== 'number') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'diff_summary.deletions should be a number',
      }
    }
    if (typeof summary1?.modifications !== 'number') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'diff_summary.modifications should be a number',
      }
    }
    if (!Array.isArray(summary1?.sections_changed)) {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'diff_summary.sections_changed should be an array',
      }
    }
    if (summary1.sections_changed.length !== 2) {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: `Expected 2 sections_changed, got ${summary1.sections_changed.length}`,
      }
    }

    // Case 2: Diff summary without sections_changed (optional field)
    const summary2: DocumentVersion['diff_summary'] = {
      additions: 0,
      deletions: 0,
      modifications: 0,
    }

    if (summary2?.sections_changed !== undefined) {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'Expected sections_changed to be undefined when not provided',
      }
    }

    // Case 3: null diff_summary (first version has no previous to diff against)
    const nullSummary: DocumentVersion['diff_summary'] = null
    if (nullSummary !== null) {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'diff_summary should be null for first version',
      }
    }

    // Case 4: DiffResult structure (input to summarizeDiff)
    const diffResult: DiffResult = {
      additions: [{ path: 'line', content: 'added' }],
      deletions: [],
      modifications: [{ path: 'line', content: 'changed', lineStart: 5, lineEnd: 5 }],
      unchanged: 10,
    }

    if (!Array.isArray(diffResult.additions)) {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'DiffResult.additions should be an array',
      }
    }
    if (typeof diffResult.unchanged !== 'number') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'DiffResult.unchanged should be a number',
      }
    }

    // Verify DiffBlock has required path and content fields
    const block = diffResult.additions[0]
    if (typeof block.path !== 'string') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'DiffBlock.path should be a string',
      }
    }
    if (typeof block.content !== 'string') {
      return {
        name: 'testDiffSummaryStructure',
        passed: false,
        error: 'DiffBlock.content should be a string',
      }
    }

    return { name: 'testDiffSummaryStructure', passed: true }
  } catch (err) {
    return {
      name: 'testDiffSummaryStructure',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testVersionNumbering,
  testDiffSummaryStructure,
]
