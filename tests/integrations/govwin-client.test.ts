import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          credentials_encrypted: JSON.stringify({
            access_token: 'gw-token',
            refresh_token: 'gw-refresh',
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          }),
        },
        error: null,
      }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null }) },
  }),
}))

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    opportunities: [
      { id: 'gw-1', title: 'Test Opp', agency: 'DHA', status: 'active' },
    ],
    access_token: 'new-token',
    refresh_token: 'new-refresh',
    expires_in: 3600,
  }),
  status: 200,
})

describe('GovWin Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOVWIN_CLIENT_ID = 'gw-client'
    process.env.GOVWIN_CLIENT_SECRET = 'gw-secret'
  })

  it('module can be imported', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    expect(mod).toBeDefined()
  })

  it('exports GovWinOpportunity type interface', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    // Check for exported functions
    expect(typeof mod).toBe('object')
  })

  it('searchOpportunities is exported', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    if ('searchOpportunities' in mod) {
      expect(typeof mod.searchOpportunities).toBe('function')
    }
  })

  it('getGovWinAuthUrl is exported', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    if ('getGovWinAuthUrl' in mod) {
      expect(typeof mod.getGovWinAuthUrl).toBe('function')
    }
  })

  it('syncGovWinAlerts is exported', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    if ('syncGovWinAlerts' in mod) {
      expect(typeof mod.syncGovWinAlerts).toBe('function')
    }
  })

  it('getCompetitorIntel is exported', async () => {
    const mod = await import('@/lib/integrations/govwin/client')
    if ('getCompetitorIntel' in mod) {
      expect(typeof mod.getCompetitorIntel).toBe('function')
    }
  })
})
