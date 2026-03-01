// filepath: tests/collaboration/artifact-status.test.ts
/**
 * Tests for ArtifactStatus type and SyncStatus validation
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 */

import type {
  ArtifactStatus,
  SyncStatus,
  CloudProvider,
} from '@/lib/types/sync'

describe('artifact-status', () => {
  it('validates all sync status values', () => {
    const validStatuses: SyncStatus[] = ['idle', 'syncing', 'synced', 'conflict', 'error']

    expect(validStatuses).toHaveLength(5)
    expect(new Set(validStatuses).size).toBe(5)

    for (const status of validStatuses) {
      expect(typeof status).toBe('string')
    }

    expect(validStatuses).toContain('idle')
    expect(validStatuses).toContain('syncing')
    expect(validStatuses).toContain('synced')
    expect(validStatuses).toContain('conflict')
    expect(validStatuses).toContain('error')
  })

  it('ArtifactStatus has all expected fields', () => {
    const artifact: ArtifactStatus = {
      volumeName: 'Technical Volume',
      documentId: 'doc-tv-001',
      syncStatus: 'synced',
      cloudProvider: 'google_drive',
      lastEditedBy: 'user-001',
      lastEditedAt: '2026-02-22T14:30:00Z',
      editSource: 'google_docs',
      wordCount: 12500,
    }

    expect(typeof artifact.volumeName).toBe('string')
    expect(artifact.volumeName).not.toBe('')
    expect(typeof artifact.documentId).toBe('string')
    expect(artifact.documentId).not.toBe('')

    const validStatuses: SyncStatus[] = ['idle', 'syncing', 'synced', 'conflict', 'error']
    expect(validStatuses).toContain(artifact.syncStatus)

    const validProviders: (CloudProvider | null)[] = ['onedrive', 'google_drive', 'sharepoint', null]
    expect(validProviders).toContain(artifact.cloudProvider)

    expect(typeof artifact.wordCount).toBe('number')
    expect(artifact.wordCount).toBeGreaterThanOrEqual(0)

    // Verify nullable fields accept null
    const nullableArtifact: ArtifactStatus = {
      volumeName: 'Management Volume',
      documentId: 'doc-mv-001',
      syncStatus: 'idle',
      cloudProvider: null,
      lastEditedBy: null,
      lastEditedAt: null,
      editSource: null,
      wordCount: 0,
    }

    expect(nullableArtifact.cloudProvider).toBeNull()
    expect(nullableArtifact.lastEditedBy).toBeNull()
    expect(nullableArtifact.lastEditedAt).toBeNull()
    expect(nullableArtifact.editSource).toBeNull()

    // Verify all expected keys are present
    const expectedKeys = [
      'volumeName', 'documentId', 'syncStatus', 'cloudProvider',
      'lastEditedBy', 'lastEditedAt', 'editSource', 'wordCount',
    ]
    for (const key of expectedKeys) {
      expect(Object.keys(artifact)).toContain(key)
    }
  })
})
