import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetUser, mockUpload, mockCreateSignedUrl, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockUpload = vi.fn()
  const mockCreateSignedUrl = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: mockGetUser },
    storage: { from: vi.fn().mockReturnValue({ upload: mockUpload, createSignedUrl: mockCreateSignedUrl }) },
  }
  return { mockFrom, mockGetUser, mockUpload, mockCreateSignedUrl, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))
vi.mock('jszip', () => {
  const fileFn = vi.fn()
  const folderFn = vi.fn().mockReturnValue({ file: fileFn })
  function MockJSZip() {
    return {
      file: fileFn,
      folder: folderFn,
      generateAsync: vi.fn().mockResolvedValue(Buffer.from('zip')),
    }
  }
  MockJSZip.prototype = {}
  return { default: MockJSZip, __esModule: true }
})

/**
 * Thenable chain: all methods return `this`, await resolves to `resolveWith`.
 */
function makeChain(resolveWith: Record<string, unknown> = { data: null, error: null }) {
  const c: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'single', 'order', 'insert', 'limit']
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  c.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
    try { resolve(resolveWith) } catch (e) { reject(e) }
  }
  return c
}

import { getArtifactStatuses, assembleCloudBinder } from '@/lib/utils/cloud-binder-assembly'

describe('getArtifactStatuses', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns empty on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    expect(await getArtifactStatuses('o1')).toEqual([])
  })
  it('returns artifact statuses with sync data', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      // call 1: proposal_sections
      if (n === 1) return makeChain({
        data: [{ id: 's1', section_title: 'Intro', volume: 'Vol I', content: 'Hello world' }],
        error: null,
      })
      // call 2: document_sync_state
      return makeChain({
        data: [{ document_id: 's1', sync_status: 'synced', cloud_provider: 'onedrive', last_cloud_edit_at: null, last_mp_edit_at: null, metadata: {} }],
      })
    })
    const result = await getArtifactStatuses('o1')
    expect(result).toHaveLength(1)
    expect(result[0].syncStatus).toBe('synced')
    expect(result[0].wordCount).toBe(2)
  })
})

describe('assembleCloudBinder', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await assembleCloudBinder('o1')
    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })
  it('returns error when opportunity not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const result = await assembleCloudBinder('o1')
    expect(result).toEqual({ success: false, error: 'Opportunity not found' })
  })
  it('returns error when no sections', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ data: { title: 'Opp 1' }, error: null })
      return makeChain({ data: [], error: null })
    })
    const result = await assembleCloudBinder('o1')
    expect(result).toEqual({ success: false, error: 'No proposal sections found for this opportunity' })
  })
  it('assembles binder successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    const sectionData = [{ id: 's1', section_title: 'Intro', volume: 'Vol I', status: 'draft', content: 'Hello world', sort_order: 1 }]
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      // 1: opportunity lookup
      if (n === 1) return makeChain({ data: { title: 'Test Opp' }, error: null })
      // 2: proposal_sections for assembleCloudBinder
      if (n === 2) return makeChain({ data: sectionData, error: null })
      // 3-4: getArtifactStatuses calls (proposal_sections x2 via two createClient calls)
      if (n <= 4) return makeChain({ data: sectionData, error: null })
      // 5+: document_sync_state, audit_logs, activity_log
      return makeChain({ data: [], error: null })
    })
    mockUpload.mockResolvedValue({ error: null })
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null })
    const result = await assembleCloudBinder('o1')
    expect(result.success).toBe(true)
  })
})
