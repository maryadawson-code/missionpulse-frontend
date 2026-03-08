import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = { from: mockFrom }
  return { mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))
vi.mock('@/lib/collaboration/sync/hash', () => ({
  contentHash: vi.fn().mockResolvedValue('hash_abc'),
  hashesMatch: vi.fn((a: string, b: string) => a === b),
}))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { SyncManager } from '@/lib/collaboration/sync/engine'

describe('SyncManager', () => {
  let sm: SyncManager
  const syncState = {
    document_id: 'd1', cloud_provider: 'onedrive', cloud_file_id: 'f1',
    sync_status: 'idle', last_sync_at: null, last_cloud_edit_at: null,
    last_mp_edit_at: null, cloud_web_url: null,
  }

  beforeEach(() => { vi.clearAllMocks(); sm = new SyncManager() })

  describe('initialize', () => {
    it('returns existing sync state', async () => {
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { ...syncState, sync_status: 'synced' }, error: null }) }))
      const r = await sm.initialize('d1', 'onedrive', 'c1', 'f1')
      expect(r.syncStatus).toBe('synced')
    })
    it('creates new sync state', async () => {
      let n = 0
      mockFrom.mockImplementation(() => { n++; if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }); return makeChain({ single: vi.fn().mockResolvedValue({ data: syncState, error: null }) }) })
      const r = await sm.initialize('d1', 'onedrive', 'c1', 'f1')
      expect(r.syncStatus).toBe('idle')
    })
    it('throws on insert failure', async () => {
      let n = 0
      mockFrom.mockImplementation(() => { n++; if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }); return makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } }) }) })
      await expect(sm.initialize('d1', 'onedrive', 'c1', 'f1')).rejects.toThrow('Failed to initialize sync')
    })
  })

  describe('startSync', () => {
    it('returns failure when not initialized', async () => {
      const r = await sm.startSync('s1', 'local', 'remote')
      expect(r.success).toBe(false)
    })
    it('returns failure when paused', async () => {
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: syncState, error: null }) }))
      await sm.initialize('d1', 'onedrive', 'c1', 'f1')
      sm.pauseSync()
      expect((await sm.startSync('s1', 'local', 'remote')).success).toBe(false)
    })
    it('detects no changes', async () => {
      const { contentHash, hashesMatch } = await import('@/lib/collaboration/sync/hash')
      vi.mocked(contentHash).mockResolvedValue('same')
      vi.mocked(hashesMatch).mockReturnValue(true)
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: syncState, error: null }) }))
      await sm.initialize('d1', 'onedrive', 'c1', 'f1')
      const r = await sm.startSync('s1', 'same', 'same')
      expect(r.success).toBe(true)
      expect(r.deltas[0].changeType).toBe('unchanged')
    })
  })

  describe('pauseSync / resumeSync', () => {
    it('pauses and resumes', () => { sm.pauseSync(); sm.resumeSync() })
  })

  describe('resolveConflict', () => {
    it('resolves a conflict', async () => {
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: syncState, error: null }) }))
      await sm.initialize('d1', 'onedrive', 'c1', 'f1')
      mockFrom.mockReturnValue(makeChain())
      expect(await sm.resolveConflict('c1', 'keep_local', 'u1')).toBe(true)
    })
  })

  describe('getSyncState', () => {
    it('returns null when not found', async () => {
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
      expect(await sm.getSyncState('d1', 'onedrive')).toBeNull()
    })
    it('returns mapped state', async () => {
      mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: { ...syncState, sync_status: 'synced' }, error: null }) }))
      const r = await sm.getSyncState('d1', 'onedrive')
      expect(r!.syncStatus).toBe('synced')
    })
  })

  describe('getConflicts', () => {
    it('returns empty when none', async () => {
      mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: [] }) }))
      expect(await sm.getConflicts('d1')).toEqual([])
    })
    it('returns mapped conflicts', async () => {
      mockFrom.mockReturnValue(makeChain({
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'c1', document_id: 'd1', section_id: 's1', mp_version: {}, cloud_version: {}, resolution: null, resolved_by: null, resolved_at: null, created_at: '2025-01-01' }],
        }),
      }))
      expect(await sm.getConflicts('d1')).toHaveLength(1)
    })
  })
})
