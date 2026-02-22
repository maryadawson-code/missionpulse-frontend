// filepath: lib/sync/diff-engine.ts
/**
 * Section-level Diff Engine
 *
 * Line-by-line and section-level diffing for proposal documents.
 * Used by the sync manager to detect changes between MissionPulse
 * and cloud provider versions before conflict resolution.
 *
 * v1.3 Sprint 29 — Sync Engine
 */
'use server'

import type { DiffResult, DiffBlock } from '@/lib/types/sync'

// ─── Line-level Diff ──────────────────────────────────────────

/**
 * Compute a line-by-line diff between two content strings.
 * Uses a simple LCS-based approach to identify additions, deletions,
 * and modifications between old and new content.
 */
export async function computeDiff(
  oldContent: string,
  newContent: string
): Promise<DiffResult> {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const additions: DiffBlock[] = []
  const deletions: DiffBlock[] = []
  const modifications: DiffBlock[] = []
  let unchanged = 0

  const lcs = buildLCSTable(oldLines, newLines)
  const { added, removed, modified, same } = extractDiffFromLCS(
    oldLines,
    newLines,
    lcs
  )

  unchanged = same

  for (const block of added) {
    additions.push({
      path: `line`,
      content: block.lines.join('\n'),
      lineStart: block.start,
      lineEnd: block.start + block.lines.length - 1,
    })
  }

  for (const block of removed) {
    deletions.push({
      path: `line`,
      content: block.lines.join('\n'),
      lineStart: block.start,
      lineEnd: block.start + block.lines.length - 1,
    })
  }

  for (const block of modified) {
    modifications.push({
      path: `line`,
      content: block.lines.join('\n'),
      lineStart: block.start,
      lineEnd: block.start + block.lines.length - 1,
    })
  }

  return { additions, deletions, modifications, unchanged }
}

// ─── Section-level Diff ───────────────────────────────────────

/**
 * Compute a section-level diff between two sets of named sections.
 * Each key in the record represents a section name, and the value
 * is the section content. Useful for proposal volumes where sections
 * are independently authored.
 */
export async function computeSectionDiff(
  oldSections: Record<string, string>,
  newSections: Record<string, string>
): Promise<DiffResult> {
  const additions: DiffBlock[] = []
  const deletions: DiffBlock[] = []
  const modifications: DiffBlock[] = []
  let unchanged = 0

  const allKeys = new Set([
    ...Object.keys(oldSections),
    ...Object.keys(newSections),
  ])

  for (const key of Array.from(allKeys)) {
    const oldValue = oldSections[key]
    const newValue = newSections[key]

    if (oldValue === undefined && newValue !== undefined) {
      // Section added
      additions.push({
        path: key,
        content: newValue,
      })
    } else if (oldValue !== undefined && newValue === undefined) {
      // Section removed
      deletions.push({
        path: key,
        content: oldValue,
      })
    } else if (oldValue !== undefined && newValue !== undefined) {
      if (oldValue !== newValue) {
        // Section modified
        modifications.push({
          path: key,
          content: newValue,
        })
      } else {
        unchanged++
      }
    }
  }

  return { additions, deletions, modifications, unchanged }
}

// ─── Summary ──────────────────────────────────────────────────

/**
 * Summarize a diff result into a compact count of changes.
 * Used for document_versions.diff_summary.
 */
export async function summarizeDiff(
  diff: DiffResult
): Promise<{ additions: number; deletions: number; modifications: number }> {
  return {
    additions: diff.additions.length,
    deletions: diff.deletions.length,
    modifications: diff.modifications.length,
  }
}

// ─── Internal Helpers ─────────────────────────────────────────

interface LineBlock {
  start: number
  lines: string[]
}

/**
 * Build an LCS (Longest Common Subsequence) table for two line arrays.
 * Returns a 2D array where lcs[i][j] is the LCS length for
 * oldLines[0..i-1] and newLines[0..j-1].
 */
function buildLCSTable(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length
  const n = newLines.length
  const table: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
      }
    }
  }

  return table
}

/**
 * Walk the LCS table backwards to extract added, removed, modified,
 * and unchanged line counts.
 */
function extractDiffFromLCS(
  oldLines: string[],
  newLines: string[],
  lcs: number[][]
): {
  added: LineBlock[]
  removed: LineBlock[]
  modified: LineBlock[]
  same: number
} {
  const added: LineBlock[] = []
  const removed: LineBlock[] = []
  const modified: LineBlock[] = []
  let same = 0

  let i = oldLines.length
  let j = newLines.length

  const addedLines: { index: number; line: string }[] = []
  const removedLines: { index: number; line: string }[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      same++
      i--
      j--
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      addedLines.unshift({ index: j - 1, line: newLines[j - 1] })
      j--
    } else if (i > 0) {
      removedLines.unshift({ index: i - 1, line: oldLines[i - 1] })
      i--
    }
  }

  // Group consecutive added lines into blocks
  let currentBlock: LineBlock | null = null
  for (const entry of addedLines) {
    if (currentBlock && entry.index === (currentBlock.start + currentBlock.lines.length)) {
      currentBlock.lines.push(entry.line)
    } else {
      if (currentBlock) added.push(currentBlock)
      currentBlock = { start: entry.index, lines: [entry.line] }
    }
  }
  if (currentBlock) added.push(currentBlock)

  // Group consecutive removed lines into blocks
  currentBlock = null
  for (const entry of removedLines) {
    if (currentBlock && entry.index === (currentBlock.start + currentBlock.lines.length)) {
      currentBlock.lines.push(entry.line)
    } else {
      if (currentBlock) removed.push(currentBlock)
      currentBlock = { start: entry.index, lines: [entry.line] }
    }
  }
  if (currentBlock) removed.push(currentBlock)

  // Detect modifications: overlapping add/remove at similar positions
  // are reclassified as modifications when line counts match
  const modifiedIndices = new Set<number>()

  for (let ai = 0; ai < added.length; ai++) {
    for (let ri = 0; ri < removed.length; ri++) {
      if (modifiedIndices.has(ri)) continue
      const addBlock = added[ai]
      const remBlock = removed[ri]

      if (
        addBlock.lines.length === remBlock.lines.length &&
        Math.abs(addBlock.start - remBlock.start) <= 1
      ) {
        modified.push({
          start: addBlock.start,
          lines: addBlock.lines,
        })
        modifiedIndices.add(ri)
        added.splice(ai, 1)
        ai--
        break
      }
    }
  }

  // Remove matched removals
  const sortedModIndices = Array.from(modifiedIndices).sort((a, b) => b - a)
  for (const idx of sortedModIndices) {
    removed.splice(idx, 1)
  }

  return { added, removed, modified, same }
}
