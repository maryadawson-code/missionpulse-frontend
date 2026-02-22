// filepath: tests/sync/diff-engine.test.ts
/**
 * Tests for diff-engine.ts — Section-level Diff Engine
 * v1.3 Sprint 31
 *
 * Tests the LCS-based diff engine that computes line-level and section-level
 * diffs between document versions. All functions under test are async.
 *
 * Import: computeDiff, summarizeDiff from '@/lib/sync/diff-engine'
 */

import { computeDiff, summarizeDiff } from '@/lib/sync/diff-engine'
import type { DiffResult } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Test 1: Both strings empty → 0 changes ──────────────────

async function testEmptyDiff(): Promise<TestResult> {
  try {
    const result: DiffResult = await computeDiff('', '')

    if (result.additions.length !== 0) {
      return {
        name: 'testEmptyDiff',
        passed: false,
        error: `Expected 0 additions, got ${result.additions.length}`,
      }
    }
    if (result.deletions.length !== 0) {
      return {
        name: 'testEmptyDiff',
        passed: false,
        error: `Expected 0 deletions, got ${result.deletions.length}`,
      }
    }
    if (result.modifications.length !== 0) {
      return {
        name: 'testEmptyDiff',
        passed: false,
        error: `Expected 0 modifications, got ${result.modifications.length}`,
      }
    }
    return { name: 'testEmptyDiff', passed: true }
  } catch (err) {
    return {
      name: 'testEmptyDiff',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Pure addition — old empty, new has 3 lines ──────

async function testPureAddition(): Promise<TestResult> {
  try {
    const oldContent = ''
    const newContent = 'Line one\nLine two\nLine three'
    const result: DiffResult = await computeDiff(oldContent, newContent)

    // The diff engine splits on '\n'. Empty string → [''], 3 lines → ['Line one','Line two','Line three'].
    // LCS between [''] and ['Line one','Line two','Line three'] should yield 3 added lines.
    const totalAdded = result.additions.reduce(
      (sum, block) => sum + block.content.split('\n').length,
      0
    )

    if (totalAdded < 3) {
      return {
        name: 'testPureAddition',
        passed: false,
        error: `Expected at least 3 added lines, got ${totalAdded} (additions: ${result.additions.length} blocks)`,
      }
    }

    return { name: 'testPureAddition', passed: true }
  } catch (err) {
    return {
      name: 'testPureAddition',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 3: Pure deletion — old has 3 lines, new empty ──────

async function testPureDeletion(): Promise<TestResult> {
  try {
    const oldContent = 'Line one\nLine two\nLine three'
    const newContent = ''
    const result: DiffResult = await computeDiff(oldContent, newContent)

    const totalDeleted = result.deletions.reduce(
      (sum, block) => sum + block.content.split('\n').length,
      0
    )

    if (totalDeleted < 3) {
      return {
        name: 'testPureDeletion',
        passed: false,
        error: `Expected at least 3 deleted lines, got ${totalDeleted} (deletions: ${result.deletions.length} blocks)`,
      }
    }

    return { name: 'testPureDeletion', passed: true }
  } catch (err) {
    return {
      name: 'testPureDeletion',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 4: Modification — change one line in middle ────────

async function testModification(): Promise<TestResult> {
  try {
    const oldContent = 'Header\nOriginal middle line\nFooter'
    const newContent = 'Header\nModified middle line\nFooter'
    const result: DiffResult = await computeDiff(oldContent, newContent)

    // The engine should detect the change. It may classify it as a modification
    // (if add/remove at same position are paired) or as 1 addition + 1 deletion.
    const totalChanges =
      result.modifications.length + result.additions.length + result.deletions.length

    if (totalChanges === 0) {
      return {
        name: 'testModification',
        passed: false,
        error: 'Expected at least 1 change (modification, addition, or deletion), got 0',
      }
    }

    // Header and Footer should be unchanged
    if (result.unchanged < 2) {
      return {
        name: 'testModification',
        passed: false,
        error: `Expected at least 2 unchanged lines, got ${result.unchanged}`,
      }
    }

    return { name: 'testModification', passed: true }
  } catch (err) {
    return {
      name: 'testModification',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 5: No change — identical strings ───────────────────

async function testNoChange(): Promise<TestResult> {
  try {
    const content = 'Section A\nSection B\nSection C'
    const result: DiffResult = await computeDiff(content, content)

    if (result.additions.length !== 0) {
      return {
        name: 'testNoChange',
        passed: false,
        error: `Expected 0 additions, got ${result.additions.length}`,
      }
    }
    if (result.deletions.length !== 0) {
      return {
        name: 'testNoChange',
        passed: false,
        error: `Expected 0 deletions, got ${result.deletions.length}`,
      }
    }
    if (result.modifications.length !== 0) {
      return {
        name: 'testNoChange',
        passed: false,
        error: `Expected 0 modifications, got ${result.modifications.length}`,
      }
    }
    if (result.unchanged <= 0) {
      return {
        name: 'testNoChange',
        passed: false,
        error: `Expected unchanged > 0, got ${result.unchanged}`,
      }
    }

    return { name: 'testNoChange', passed: true }
  } catch (err) {
    return {
      name: 'testNoChange',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 6: summarizeDiff returns correct counts ────────────

async function testSummarizeDiff(): Promise<TestResult> {
  try {
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

    if (summary.additions !== 2) {
      return {
        name: 'testSummarizeDiff',
        passed: false,
        error: `Expected additions=2, got ${summary.additions}`,
      }
    }
    if (summary.deletions !== 1) {
      return {
        name: 'testSummarizeDiff',
        passed: false,
        error: `Expected deletions=1, got ${summary.deletions}`,
      }
    }
    if (summary.modifications !== 3) {
      return {
        name: 'testSummarizeDiff',
        passed: false,
        error: `Expected modifications=3, got ${summary.modifications}`,
      }
    }

    return { name: 'testSummarizeDiff', passed: true }
  } catch (err) {
    return {
      name: 'testSummarizeDiff',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testEmptyDiff,
  testPureAddition,
  testPureDeletion,
  testModification,
  testNoChange,
  testSummarizeDiff,
]
