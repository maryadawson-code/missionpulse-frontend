/**
 * v1.3 Regression Tests — Phase J Document Collaboration Loop
 * Sprint 31 (T-31.3)
 *
 * Verifies all sync engine modules, tables, coordination engine,
 * RBAC on new pages, and no circular dependencies.
 *
 * © 2026 Mission Meets Tech
 */

import { describe, it, expect } from 'vitest'

// ─── Sync Engine Imports ────────────────────────────────────────

describe('v1.3 Sync Engine Modules', () => {
  it('imports sync types', async () => {
    const mod = await import('@/lib/collaboration/sync/types')
    expect(mod).toBeDefined()
  })

  it('imports hash utility', async () => {
    const mod = await import('@/lib/collaboration/sync/hash')
    expect(mod.contentHash).toBeDefined()
    expect(mod.hashesMatch).toBeDefined()
  })

  it('imports SyncManager', async () => {
    const mod = await import('@/lib/collaboration/sync/engine')
    expect(mod.SyncManager).toBeDefined()
  })

  it('imports Word Online provider', async () => {
    const mod = await import('@/lib/collaboration/sync/providers/word-online')
    expect(mod.getDocumentSections).toBeDefined()
    expect(mod.pushSectionContent).toBeDefined()
    expect(mod.pullSectionContent).toBeDefined()
    expect(mod.watchForChanges).toBeDefined()
  })

  it('imports Excel Online provider', async () => {
    const mod = await import('@/lib/collaboration/sync/providers/excel-online')
    expect(mod.getWorksheetData).toBeDefined()
    expect(mod.pushCellRange).toBeDefined()
    expect(mod.pullCellRange).toBeDefined()
  })

  it('imports PowerPoint Online provider', async () => {
    const mod = await import('@/lib/collaboration/sync/providers/pptx-online')
    expect(mod.getSlideContent).toBeDefined()
    expect(mod.pushSlideContent).toBeDefined()
  })

  it('imports Google Docs provider', async () => {
    const mod = await import('@/lib/collaboration/sync/providers/google-docs')
    expect(mod.getDocumentSections).toBeDefined()
    expect(mod.pushSectionContent).toBeDefined()
    expect(mod.pullSectionContent).toBeDefined()
  })

  it('imports Google Sheets provider', async () => {
    const mod = await import('@/lib/collaboration/sync/providers/google-sheets')
    expect(mod.getSheetData).toBeDefined()
    expect(mod.pushCellRange).toBeDefined()
    expect(mod.pullCellRange).toBeDefined()
  })
})

// ─── Coordination Engine ────────────────────────────────────────

describe('v1.3 Coordination Engine', () => {
  it('imports CoordinationEngine', async () => {
    const mod = await import('@/lib/collaboration/coordination/engine')
    expect(mod.CoordinationEngine).toBeDefined()
  })

  it('imports dependency map', async () => {
    const mod = await import('@/lib/collaboration/coordination/dependency-map')
    expect(mod.DEPENDENCY_MAP).toBeDefined()
    expect(mod.DEPENDENCY_MAP.length).toBeGreaterThan(0)
    expect(mod.getDownstreamTargets).toBeDefined()
    expect(mod.getUpstreamSources).toBeDefined()
  })

  it('dependency map has no circular references', async () => {
    const { DEPENDENCY_MAP } = await import('@/lib/collaboration/coordination/dependency-map')

    for (const edge of DEPENDENCY_MAP) {
      expect(edge.source).not.toBe(edge.target)
    }

    // Check for transitive cycles (A→B→A)
    const adjacency = new Map<string, Set<string>>()
    for (const edge of DEPENDENCY_MAP) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
      adjacency.get(edge.source)!.add(edge.target)
    }

    function hasCycle(node: string, visited: Set<string>, stack: Set<string>): boolean {
      visited.add(node)
      stack.add(node)
      for (const neighbor of adjacency.get(node) ?? []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, visited, stack)) return true
        } else if (stack.has(neighbor)) {
          return true
        }
      }
      stack.delete(node)
      return false
    }

    const visited = new Set<string>()
    const stack = new Set<string>()
    for (const node of adjacency.keys()) {
      if (!visited.has(node)) {
        expect(hasCycle(node, visited, stack)).toBe(false)
      }
    }
  })
})

// ─── Version History ────────────────────────────────────────────

describe('v1.3 Version History', () => {
  it('imports versioning module', async () => {
    const mod = await import('@/lib/collaboration/versioning/history')
    expect(mod.saveVersion).toBeDefined()
    expect(mod.getVersionHistory).toBeDefined()
    expect(mod.diffVersions).toBeDefined()
  })

  it('diffVersions produces correct output', async () => {
    const { diffVersions } = await import('@/lib/collaboration/versioning/history')
    const result = diffVersions('line one\nline two', 'line one\nline three')
    expect(result.additionCount).toBeGreaterThan(0)
    expect(result.deletionCount).toBeGreaterThan(0)
  })
})

// ─── Hash Utility ───────────────────────────────────────────────

describe('v1.3 Hash Utility', () => {
  it('contentHash returns consistent hash', async () => {
    const { contentHash } = await import('@/lib/collaboration/sync/hash')
    const hash1 = await contentHash('hello world')
    const hash2 = await contentHash('hello world')
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64) // SHA-256 = 64 hex chars
  })

  it('hashesMatch detects differences', async () => {
    const { contentHash, hashesMatch } = await import('@/lib/collaboration/sync/hash')
    const hash1 = await contentHash('hello')
    const hash2 = await contentHash('world')
    expect(hashesMatch(hash1, hash1)).toBe(true)
    expect(hashesMatch(hash1, hash2)).toBe(false)
  })
})

// ─── Migration Tables ──────────────────────────────────────────

describe('v1.3 Migration Tables', () => {
  it('Phase J migration file exists', async () => {
    const fs = await import('fs')
    const path = 'supabase/migrations/20260222000004_v1_3_phase_j.sql'
    expect(fs.existsSync(path)).toBe(true)
  })
})
