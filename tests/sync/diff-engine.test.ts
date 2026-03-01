// filepath: tests/sync/diff-engine.test.ts
/**
 * Tests for diff-engine.ts — Section-level Diff Engine
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import { computeDiff, summarizeDiff } from '@/lib/sync/diff-engine'
import type { DiffResult } from '@/lib/types/sync'

describe('diff-engine', () => {
  it('returns 0 changes for two empty strings', async () => {
    const result = await computeDiff('', '')

    expect(result.additions).toHaveLength(0)
    expect(result.deletions).toHaveLength(0)
    expect(result.modifications).toHaveLength(0)
  })

  it('detects pure addition when old is empty', async () => {
    const result = await computeDiff('', 'Line one\nLine two\nLine three')

    const totalAdded = result.additions.reduce(
      (sum, block) => sum + block.content.split('\n').length,
      0
    )
    expect(totalAdded).toBeGreaterThanOrEqual(3)
  })

  it('detects pure deletion when new is empty', async () => {
    const result = await computeDiff('Line one\nLine two\nLine three', '')

    const totalDeleted = result.deletions.reduce(
      (sum, block) => sum + block.content.split('\n').length,
      0
    )
    expect(totalDeleted).toBeGreaterThanOrEqual(3)
  })

  it('detects modification when one line changes', async () => {
    const result = await computeDiff(
      'Header\nOriginal middle line\nFooter',
      'Header\nModified middle line\nFooter'
    )

    const totalChanges =
      result.modifications.length + result.additions.length + result.deletions.length
    expect(totalChanges).toBeGreaterThanOrEqual(1)
    expect(result.unchanged).toBeGreaterThanOrEqual(2)
  })

  it('returns 0 changes for identical strings', async () => {
    const content = 'Section A\nSection B\nSection C'
    const result = await computeDiff(content, content)

    expect(result.additions).toHaveLength(0)
    expect(result.deletions).toHaveLength(0)
    expect(result.modifications).toHaveLength(0)
    expect(result.unchanged).toBeGreaterThan(0)
  })

  it('summarizeDiff returns correct counts', async () => {
    const mockDiff: DiffResult = {
      additions: [
        { path: 'line', content: 'new line 1' },
        { path: 'line', content: 'new line 2' },
      ],
      deletions: [{ path: 'line', content: 'old line 1' }],
      modifications: [
        { path: 'line', content: 'changed 1' },
        { path: 'line', content: 'changed 2' },
        { path: 'line', content: 'changed 3' },
      ],
      unchanged: 10,
    }

    const summary = await summarizeDiff(mockDiff)

    expect(summary.additions).toBe(2)
    expect(summary.deletions).toBe(1)
    expect(summary.modifications).toBe(3)
  })
})
