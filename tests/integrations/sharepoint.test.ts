/**
 * Tests for lib/integrations/m365/sharepoint.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockChain, mockSupabase } = vi.hoisted(() => {
  const mockChain = (): Record<string, any> => {
    const chain: Record<string, any> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.update = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    return chain
  }
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockReturnValue(mockChain()),
  }
  return { mockChain, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/integrations/m365/auth', () => ({
  refreshM365Token: vi.fn().mockResolvedValue({
    access_token: 'new-at',
    refresh_token: 'new-rt',
    expires_in: 3600,
  }),
}))

import {
  listSites,
  listLibraries,
  uploadToSharePoint,
  listSharePointFiles,
  setSharePointTarget,
} from '@/lib/integrations/m365/sharepoint'

function setupConnected() {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  let callCount = 0
  mockSupabase.from.mockImplementation(() => {
    callCount++
    const chain = mockChain()
    if (callCount === 1) {
      chain.single.mockResolvedValueOnce({ data: { company_id: 'c1' }, error: null })
    } else {
      chain.single.mockResolvedValueOnce({
        data: {
          id: 'int-1',
          credentials_encrypted: JSON.stringify({
            access_token: 'valid',
            refresh_token: 'rt',
            expires_at: Date.now() + 300000,
          }),
        },
        error: null,
      })
    }
    return chain
  })
}

describe('listSites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns empty when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await listSites()
    expect(result.sites).toEqual([])
  })

  it('returns sites on success', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        value: [
          { id: 's1', name: 'Site1', displayName: 'Site 1', webUrl: 'https://sp/site1' },
        ],
      }),
    })

    const result = await listSites()
    expect(result.sites).toHaveLength(1)
    expect(result.sites[0].displayName).toBe('Site 1')
  })

  it('handles API error', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await listSites()
    expect(result.sites).toEqual([])
    expect(result.error).toContain('500')
  })

  it('handles network error', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Timeout'))

    const result = await listSites()
    expect(result.sites).toEqual([])
    expect(result.error).toBe('Timeout')
  })
})

describe('listLibraries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns empty when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await listLibraries('s1')
    expect(result.libraries).toEqual([])
  })

  it('returns libraries on success', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        value: [{ id: 'lib1', name: 'Documents', webUrl: 'https://sp/lib' }],
      }),
    })

    const result = await listLibraries('s1')
    expect(result.libraries).toHaveLength(1)
    expect(result.libraries[0].driveId).toBe('lib1')
  })
})

describe('uploadToSharePoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await uploadToSharePoint('d1', 'path', 'file.docx', Buffer.from('x'))
    expect(result.success).toBe(false)
  })

  it('uploads successfully', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ webUrl: 'https://sp/file' }),
    })

    const result = await uploadToSharePoint('d1', 'folder', 'file.docx', Buffer.from('data'))
    expect(result.success).toBe(true)
    expect(result.webUrl).toBe('https://sp/file')
  })

  it('uploads to root when no folderPath', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ webUrl: 'https://sp/root/file' }),
    })

    const result = await uploadToSharePoint('d1', '', 'file.docx', Buffer.from('data'))
    expect(result.success).toBe(true)
  })

  it('handles upload failure', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      text: vi.fn().mockResolvedValue('Error'),
    })

    const result = await uploadToSharePoint('d1', 'p', 'f.docx', Buffer.from('x'))
    expect(result.success).toBe(false)
    expect(result.error).toContain('Upload failed')
  })
})

describe('listSharePointFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns empty on 404', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 404 })

    const result = await listSharePointFiles('d1', 'path')
    expect(result.files).toEqual([])
  })

  it('filters out folders', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        value: [
          { id: 'f1', name: 'doc.docx', size: 100, webUrl: 'u', lastModifiedDateTime: 't', file: {} },
          { id: 'f2', name: 'subfolder', webUrl: 'u2', lastModifiedDateTime: 't2' },
        ],
      }),
    })

    const result = await listSharePointFiles('d1')
    expect(result.files).toHaveLength(1)
  })
})

describe('setSharePointTarget', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await setSharePointTarget('s1', 'Site', 'd1', 'Docs')
    expect(result.success).toBe(false)
  })
})
