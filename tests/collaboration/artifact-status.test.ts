// filepath: tests/collaboration/artifact-status.test.ts
/**
 * Tests for ArtifactStatus type and SyncStatus validation
 * v1.3 Sprint 31
 *
 * Verifies that the ArtifactStatus interface has all expected fields
 * and that SyncStatus values conform to the known set.
 *
 * Types from: lib/types/sync.ts
 */

import type {
  ArtifactStatus,
  SyncStatus,
  CloudProvider,
  DocumentSource,
} from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Test 1: All sync status values are valid ────────────────

function testSyncStatusTypes(): TestResult {
  try {
    // The SyncStatus union: 'idle' | 'syncing' | 'synced' | 'conflict' | 'error'
    const validStatuses: SyncStatus[] = ['idle', 'syncing', 'synced', 'conflict', 'error']

    // Verify each status can be assigned to the type
    for (const status of validStatuses) {
      const test: SyncStatus = status
      if (typeof test !== 'string') {
        return {
          name: 'testSyncStatusTypes',
          passed: false,
          error: `Status '${status}' should be a string`,
        }
      }
    }

    // Verify we have exactly 5 known statuses
    if (validStatuses.length !== 5) {
      return {
        name: 'testSyncStatusTypes',
        passed: false,
        error: `Expected 5 sync status values, got ${validStatuses.length}`,
      }
    }

    // Verify no duplicates
    const unique = new Set(validStatuses)
    if (unique.size !== validStatuses.length) {
      return {
        name: 'testSyncStatusTypes',
        passed: false,
        error: 'Duplicate sync status values detected',
      }
    }

    // Verify specific statuses are present
    const requiredStatuses = ['idle', 'syncing', 'synced', 'conflict', 'error'] as const
    for (const required of requiredStatuses) {
      if (!validStatuses.includes(required)) {
        return {
          name: 'testSyncStatusTypes',
          passed: false,
          error: `Required status '${required}' missing from valid statuses`,
        }
      }
    }

    return { name: 'testSyncStatusTypes', passed: true }
  } catch (err) {
    return {
      name: 'testSyncStatusTypes',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: ArtifactStatus has expected fields ──────────────

function testArtifactStatusStructure(): TestResult {
  try {
    // Create a valid ArtifactStatus object with all required fields
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

    // Verify volumeName
    if (typeof artifact.volumeName !== 'string' || artifact.volumeName === '') {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'volumeName should be a non-empty string',
      }
    }

    // Verify documentId
    if (typeof artifact.documentId !== 'string' || artifact.documentId === '') {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'documentId should be a non-empty string',
      }
    }

    // Verify syncStatus is a valid SyncStatus
    const validStatuses: SyncStatus[] = ['idle', 'syncing', 'synced', 'conflict', 'error']
    if (!validStatuses.includes(artifact.syncStatus)) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: `syncStatus '${artifact.syncStatus}' is not a valid SyncStatus`,
      }
    }

    // Verify cloudProvider (nullable)
    const validProviders: (CloudProvider | null)[] = ['onedrive', 'google_drive', 'sharepoint', null]
    if (!validProviders.includes(artifact.cloudProvider)) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: `cloudProvider '${artifact.cloudProvider}' is not valid`,
      }
    }

    // Verify wordCount is a non-negative number
    if (typeof artifact.wordCount !== 'number' || artifact.wordCount < 0) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: `wordCount should be a non-negative number, got ${artifact.wordCount}`,
      }
    }

    // Verify nullable fields can be null
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

    if (nullableArtifact.cloudProvider !== null) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'cloudProvider should accept null',
      }
    }
    if (nullableArtifact.lastEditedBy !== null) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'lastEditedBy should accept null',
      }
    }
    if (nullableArtifact.lastEditedAt !== null) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'lastEditedAt should accept null',
      }
    }
    if (nullableArtifact.editSource !== null) {
      return {
        name: 'testArtifactStatusStructure',
        passed: false,
        error: 'editSource should accept null',
      }
    }

    // Verify all ArtifactStatus keys are present
    const expectedKeys = [
      'volumeName',
      'documentId',
      'syncStatus',
      'cloudProvider',
      'lastEditedBy',
      'lastEditedAt',
      'editSource',
      'wordCount',
    ]
    const artifactKeys = Object.keys(artifact)
    for (const key of expectedKeys) {
      if (!artifactKeys.includes(key)) {
        return {
          name: 'testArtifactStatusStructure',
          passed: false,
          error: `Missing expected key '${key}' in ArtifactStatus`,
        }
      }
    }

    return { name: 'testArtifactStatusStructure', passed: true }
  } catch (err) {
    return {
      name: 'testArtifactStatusStructure',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testSyncStatusTypes,
  testArtifactStatusStructure,
]
