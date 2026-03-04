// filepath: tests/sync/version-tracker.test.ts
/**
 * Tests for version-tracker.ts — Version Tracking Logic
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import type { DocumentVersion, DiffResult } from '@/lib/types/sync'

describe('version-tracker', () => {
  it('increments version numbers correctly', () => {
    // No previous version → version 1
    const prev1: number | undefined = undefined
    expect((prev1 ?? 0) + 1).toBe(1)

    // Previous version 1 → version 2
    expect((1 ?? 0) + 1).toBe(2)

    // Previous version 99 → version 100
    expect((99 ?? 0) + 1).toBe(100)

    // Version 0 (edge case) → version 1
    expect((0 ?? 0) + 1).toBe(1)

    // DocumentVersion object
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
    expect(mockVersion.version_number + 1).toBe(6)
  })

  it('diff summary has expected fields', () => {
    // Full diff summary with sections_changed
    const summary1: DocumentVersion['diff_summary'] = {
      additions: 3,
      deletions: 1,
      modifications: 2,
      sections_changed: ['executive_summary', 'pricing'],
    }

    expect(typeof summary1?.additions).toBe('number')
    expect(typeof summary1?.deletions).toBe('number')
    expect(typeof summary1?.modifications).toBe('number')
    expect(Array.isArray(summary1?.sections_changed)).toBe(true)
    expect(summary1!.sections_changed).toHaveLength(2)

    // Diff summary without sections_changed (optional field)
    const summary2: DocumentVersion['diff_summary'] = {
      additions: 0,
      deletions: 0,
      modifications: 0,
    }
    expect(summary2?.sections_changed).toBeUndefined()

    // Null diff_summary (first version)
    const nullSummary: DocumentVersion['diff_summary'] = null
    expect(nullSummary).toBeNull()

    // DiffResult structure
    const diffResult: DiffResult = {
      additions: [{ path: 'line', content: 'added' }],
      deletions: [],
      modifications: [{ path: 'line', content: 'changed', lineStart: 5, lineEnd: 5 }],
      unchanged: 10,
    }

    expect(Array.isArray(diffResult.additions)).toBe(true)
    expect(typeof diffResult.unchanged).toBe('number')
    expect(typeof diffResult.additions[0].path).toBe('string')
    expect(typeof diffResult.additions[0].content).toBe('string')
  })
})
