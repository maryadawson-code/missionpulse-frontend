/**
 * Tests for lib/integrations/m365/onedrive.ts
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
  saveToOneDrive,
  getWordOnlineUrl,
  listOneDriveFiles,
  downloadFromOneDrive,
  checkForUpdates,
} from '@/lib/integrations/m365/onedrive'

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

describe('saveToOneDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await saveToOneDrive(Buffer.from('test'), 'file.docx', 'Opp Title', 'Vol 1')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('uploads file successfully', async () => {
    setupConnected()
    // folder check calls + upload call
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200 }) // /MissionPulse check
      .mockResolvedValueOnce({ ok: true, status: 200 }) // /Opp_Title check
      .mockResolvedValueOnce({ ok: true, status: 200 }) // /Vol_1 check
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ webUrl: 'https://onedrive.com/file' }),
      })

    const result = await saveToOneDrive(Buffer.from('content'), 'doc.docx', 'Opp Title', 'Vol 1')
    expect(result.success).toBe(true)
    expect(result.webUrl).toBe('https://onedrive.com/file')
  })

  it('handles upload failure', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValue('Upload error'),
      })

    const result = await saveToOneDrive(Buffer.from('x'), 'f.docx', 'T', 'V')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Upload failed')
  })

  it('handles network error during upload', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockRejectedValueOnce(new Error('Network down'))

    const result = await saveToOneDrive(Buffer.from('x'), 'f.docx', 'T', 'V')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network down')
  })
})

describe('getWordOnlineUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await getWordOnlineUrl('file-1')
    expect(result.url).toBeNull()
  })

  it('returns webUrl on success', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ webUrl: 'https://onedrive.com/edit/file-1' }),
    })

    const result = await getWordOnlineUrl('file-1')
    expect(result.url).toBe('https://onedrive.com/edit/file-1')
  })

  it('returns error on API failure', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 404 })

    const result = await getWordOnlineUrl('file-1')
    expect(result.url).toBeNull()
    expect(result.error).toContain('404')
  })
})

describe('listOneDriveFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns empty when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await listOneDriveFiles('Opp Title')
    expect(result.files).toEqual([])
  })

  it('returns files list on success', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        value: [
          {
            id: 'f1',
            name: 'doc.docx',
            size: 1024,
            webUrl: 'https://url',
            lastModifiedDateTime: '2026-01-01',
            file: { mimeType: 'application/docx' },
            '@microsoft.graph.downloadUrl': 'https://dl',
          },
          {
            id: 'f2',
            name: 'folder',
            webUrl: 'https://url2',
            lastModifiedDateTime: '2026-01-01',
            folder: { childCount: 3 },
          },
        ],
      }),
    })

    const result = await listOneDriveFiles('Opp Title', 'Volume 1')
    expect(result.files).toHaveLength(1)
    expect(result.files[0].name).toBe('doc.docx')
    expect(result.files[0].downloadUrl).toBe('https://dl')
  })

  it('returns empty on 404', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 404 })

    const result = await listOneDriveFiles('Nonexistent')
    expect(result.files).toEqual([])
  })
})

describe('downloadFromOneDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns null when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await downloadFromOneDrive('file-1')
    expect(result.data).toBeNull()
  })

  it('downloads file data', async () => {
    setupConnected()
    const buf = new ArrayBuffer(8)
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(buf),
    })

    const result = await downloadFromOneDrive('file-1')
    expect(result.data).toBeDefined()
  })

  it('returns error on download failure', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 403 })

    const result = await downloadFromOneDrive('file-1')
    expect(result.data).toBeNull()
    expect(result.error).toContain('403')
  })
})

describe('checkForUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await checkForUpdates('Opp Title')
    expect(result.updatedFiles).toEqual([])
    expect(result.error).toBe('Not authenticated')
  })
})
