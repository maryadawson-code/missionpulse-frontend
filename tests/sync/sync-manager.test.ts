import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockGetUser = vi.fn()

function createChainMock(terminalValue: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['select', 'eq', 'gte', 'lte', 'order', 'limit', 'contains']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single = vi.fn().mockResolvedValue(terminalValue)
  chain.maybeSingle = vi.fn().mockResolvedValue(terminalValue)
  chain.insert = vi.fn().mockResolvedValue({ error: null })
  chain.update = vi.fn().mockResolvedValue({ error: null })
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockResolvedValue({ error: null })
  return chain
}

let defaultChain = createChainMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/sync/diff-engine', () => ({
  computeDiff: vi.fn().mockResolvedValue({ hunks: [] }),
  summarizeDiff: vi.fn().mockResolvedValue({ additions: 1, deletions: 0, modifications: 0 }),
}))

vi.mock('@/lib/sync/conflict-resolver', () => ({
  detectConflict: vi.fn().mockResolvedValue({ hasConflict: false, cloudChanged: false, mpChanged: false }),
  createConflictRecord: vi.fn().mockResolvedValue(undefined),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  processWebhook,
  fetchCloudContent,
  syncToCloud,
  getSyncStatus,
  initializeSync,
} from '@/lib/sync/sync-manager'
import { detectConflict, createConflictRecord } from '@/lib/sync/conflict-resolver'

// ─── Tests ──────────────────────────────────────────────────

describe('sync-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    defaultChain = createChainMock()
    mockFrom.mockReturnValue(defaultChain)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockFetch.mockReset()
  })

  // ── processWebhook ──────────────────────────────────────

  describe('processWebhook', () => {
    it('should return early if cloudFileId cannot be extracted', async () => {
      await processWebhook('onedrive', {})
      // No supabase calls expected beyond createClient
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return early if no sync state found', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      await processWebhook('onedrive', {
        value: [{ resourceData: { id: 'file-123' } }],
      })

      expect(defaultChain.eq).toHaveBeenCalled()
    })

    it('should extract google_drive fileId from payload', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      await processWebhook('google_drive', { fileId: 'gfile-1' })
      expect(defaultChain.eq).toHaveBeenCalled()
    })

    it('should extract sharepoint fileId from payload', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      await processWebhook('sharepoint', {
        value: [{ resourceData: { id: 'sp-file-1' } }],
      })
      expect(defaultChain.eq).toHaveBeenCalled()
    })
  })

  // ── fetchCloudContent ───────────────────────────────────

  describe('fetchCloudContent', () => {
    it('should return null if no sync state found', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      const result = await fetchCloudContent('doc-1', 'onedrive')
      expect(result).toBeNull()
    })

    it('should return null if no provider token', async () => {
      // First call: sync state lookup returns data
      const syncChain = createChainMock({ data: { cloud_file_id: 'f1', metadata: {} }, error: null })
      // Second call: profile lookup returns no company
      const profileChain = createChainMock({ data: null, error: null })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount <= 1) return syncChain
        return profileChain
      })

      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await fetchCloudContent('doc-1', 'onedrive')
      expect(result).toBeNull()
    })

    it('should return content when fetch succeeds', async () => {
      // fetchCloudContent calls createClient once, then uses from() for sync_state,
      // then createClient again for getProviderToken which calls from() for profiles + integrations
      mockFrom.mockImplementation((table: string) => {
        if (table === 'document_sync_state') {
          return createChainMock({ data: { cloud_file_id: 'f1', metadata: {} }, error: null })
        }
        if (table === 'profiles') {
          return createChainMock({ data: { company_id: 'comp-1' }, error: null })
        }
        if (table === 'integrations') {
          return createChainMock({
            data: { credentials_encrypted: JSON.stringify({ access_token: 'tok', expires_at: Date.now() + 999999 }) },
            error: null,
          })
        }
        return createChainMock()
      })

      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('file content') })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ lastModifiedDateTime: '2025-01-01T00:00:00Z' }) })

      const result = await fetchCloudContent('doc-1', 'onedrive')
      expect(result).not.toBeNull()
      expect(result?.content).toBe('file content')
    })

    it('should return null when fetch fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'document_sync_state') {
          return createChainMock({ data: { cloud_file_id: 'f1', metadata: {} }, error: null })
        }
        if (table === 'profiles') {
          return createChainMock({ data: { company_id: 'comp-1' }, error: null })
        }
        if (table === 'integrations') {
          return createChainMock({
            data: { credentials_encrypted: JSON.stringify({ access_token: 'tok', expires_at: Date.now() + 999999 }) },
            error: null,
          })
        }
        return createChainMock()
      })

      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await fetchCloudContent('doc-1', 'onedrive')
      expect(result).toBeNull()
    })
  })

  // ── syncToCloud ──────────────────────────────────────────

  describe('syncToCloud', () => {
    it('should return error if no sync state found', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      const result = await syncToCloud('doc-1', 'content', 'onedrive')
      expect(result.success).toBe(false)
      expect(result.error).toContain('No sync state')
    })
  })

  // ── getSyncStatus ────────────────────────────────────────

  describe('getSyncStatus', () => {
    it('should return null if no data', async () => {
      defaultChain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(defaultChain)

      const result = await getSyncStatus('doc-1')
      expect(result).toBeNull()
    })

    it('should return sync state data', async () => {
      const syncData = { id: 's1', document_id: 'doc-1', sync_status: 'synced' }
      defaultChain = createChainMock({ data: syncData, error: null })
      mockFrom.mockReturnValue(defaultChain)

      const result = await getSyncStatus('doc-1')
      expect(result).toEqual(syncData)
    })
  })

  // ── initializeSync ───────────────────────────────────────

  describe('initializeSync', () => {
    it('should return error if sync already exists', async () => {
      defaultChain = createChainMock({ data: { id: 'existing' }, error: null })
      mockFrom.mockReturnValue(defaultChain)

      const result = await initializeSync('doc-1', 'onedrive', 'cloud-1', 'comp-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('already initialized')
    })

    it('should create sync state and audit log on success', async () => {
      const selectChain = createChainMock({ data: null, error: null })
      const insertChain = createChainMock({ error: null })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return selectChain
        return insertChain
      })

      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

      const result = await initializeSync('doc-1', 'onedrive', 'cloud-1', 'comp-1')
      expect(result.success).toBe(true)
    })

    it('should return error on insert failure', async () => {
      // initializeSync calls createClient() once. It calls from('document_sync_state') twice:
      // first for .select().eq().eq().single() (existing check - should return null),
      // then for .insert() (should return error).
      // Since mockFrom returns a new chain each time, we track calls.
      let docSyncCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'document_sync_state') {
          docSyncCallCount++
          if (docSyncCallCount === 1) {
            // Existing check: no existing record
            return createChainMock({ data: null, error: null })
          }
          // Insert call
          const chain = createChainMock()
          chain.insert = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
          return chain
        }
        return createChainMock()
      })

      const result = await initializeSync('doc-1', 'onedrive', 'cloud-1', 'comp-1')
      expect(result.success).toBe(false)
      expect(result.error).toBe('DB error')
    })
  })
})
