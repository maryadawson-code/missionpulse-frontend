// filepath: tests/sync/conflict-resolver.test.ts
/**
 * Tests for conflict-resolver.ts — Conflict Detection & Merge Logic
 * v1.3 Sprint 31
 *
 * Pure logic tests for the merge algorithm concepts. Since the actual
 * conflict-resolver.ts depends on Supabase for resolveConflict and
 * createConflictRecord, these tests exercise the detection and merge
 * functions directly (detectConflict, getMergedContent) which are
 * pure async functions that do not require a database.
 *
 * Import: detectConflict, getMergedContent from '@/lib/sync/conflict-resolver'
 */

import { detectConflict, getMergedContent } from '@/lib/sync/conflict-resolver'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Test 1: Non-overlapping edits can merge ─────────────────

async function testMergeNonOverlapping(): Promise<TestResult> {
  try {
    // Base document has 5 lines. MP edits line 1, cloud edits line 5.
    // These are non-overlapping edits.
    const base = 'Line A\nLine B\nLine C\nLine D\nLine E'
    const mp = 'Line A MODIFIED BY MP\nLine B\nLine C\nLine D\nLine E'
    const cloud = 'Line A\nLine B\nLine C\nLine D\nLine E MODIFIED BY CLOUD'

    const detection = await detectConflict(mp, cloud, base)

    // Both sides changed
    if (!detection.mpChanged) {
      return {
        name: 'testMergeNonOverlapping',
        passed: false,
        error: 'Expected mpChanged=true',
      }
    }
    if (!detection.cloudChanged) {
      return {
        name: 'testMergeNonOverlapping',
        passed: false,
        error: 'Expected cloudChanged=true',
      }
    }

    // The conflict regions should reflect that both changed different lines.
    // Line 0: MP differs from base, cloud same as base → not a conflict region
    // Line 4: cloud differs from base, MP same as base → not a conflict region
    // So there should be 0 conflict regions (edits are non-overlapping).
    if (detection.conflictRegions.length !== 0) {
      return {
        name: 'testMergeNonOverlapping',
        passed: false,
        error: `Expected 0 conflict regions for non-overlapping edits, got ${detection.conflictRegions.length}`,
      }
    }

    // hasConflict should be false (non-overlapping changes)
    if (detection.hasConflict) {
      return {
        name: 'testMergeNonOverlapping',
        passed: false,
        error: 'Expected hasConflict=false for non-overlapping edits',
      }
    }

    return { name: 'testMergeNonOverlapping', passed: true }
  } catch (err) {
    return {
      name: 'testMergeNonOverlapping',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Identical changes from both sides = no conflict ─

async function testIdenticalChanges(): Promise<TestResult> {
  try {
    const base = 'Original line\nSecond line\nThird line'
    const mp = 'Changed line\nSecond line\nThird line'
    const cloud = 'Changed line\nSecond line\nThird line'

    const detection = await detectConflict(mp, cloud, base)

    // Both MP and cloud made the same change, so content is identical
    if (detection.hasConflict) {
      return {
        name: 'testIdenticalChanges',
        passed: false,
        error: 'Expected hasConflict=false when both sides have identical content',
      }
    }

    // Since mp === cloud, mpChanged and cloudChanged should both be false
    // (detectConflict short-circuits when mpContent === cloudContent)
    if (detection.mpChanged !== false || detection.cloudChanged !== false) {
      return {
        name: 'testIdenticalChanges',
        passed: false,
        error: `Expected mpChanged=false, cloudChanged=false when content identical. Got mpChanged=${detection.mpChanged}, cloudChanged=${detection.cloudChanged}`,
      }
    }

    return { name: 'testIdenticalChanges', passed: true }
  } catch (err) {
    return {
      name: 'testIdenticalChanges',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 3: Overlapping changes detected correctly ──────────

async function testConflictDetection(): Promise<TestResult> {
  try {
    // Both MP and cloud modify the same line differently
    const base = 'Shared header\nOriginal content here\nShared footer'
    const mp = 'Shared header\nMP version of content\nShared footer'
    const cloud = 'Shared header\nCloud version of content\nShared footer'

    const detection = await detectConflict(mp, cloud, base)

    // Both sides changed
    if (!detection.mpChanged) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected mpChanged=true',
      }
    }
    if (!detection.cloudChanged) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected cloudChanged=true',
      }
    }

    // There should be a conflict since both changed line 1 differently
    if (!detection.hasConflict) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected hasConflict=true for overlapping changes',
      }
    }

    if (detection.conflictRegions.length === 0) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected at least 1 conflict region',
      }
    }

    // Verify the conflict region covers line 1
    const region = detection.conflictRegions[0]
    if (region.lineStart > 1 || region.lineEnd < 1) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: `Expected conflict region to cover line 1, got lineStart=${region.lineStart}, lineEnd=${region.lineEnd}`,
      }
    }

    // Additionally, verify getMergedContent produces conflict markers
    const merged = await getMergedContent(mp, cloud)
    if (!merged.includes('<<<<<<< MissionPulse')) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected merged content to contain conflict markers (<<<<<<< MissionPulse)',
      }
    }
    if (!merged.includes('>>>>>>> Cloud')) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected merged content to contain conflict markers (>>>>>>> Cloud)',
      }
    }
    if (!merged.includes('MP version of content')) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected merged content to contain MP version text',
      }
    }
    if (!merged.includes('Cloud version of content')) {
      return {
        name: 'testConflictDetection',
        passed: false,
        error: 'Expected merged content to contain cloud version text',
      }
    }

    return { name: 'testConflictDetection', passed: true }
  } catch (err) {
    return {
      name: 'testConflictDetection',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testMergeNonOverlapping,
  testIdenticalChanges,
  testConflictDetection,
]
