/**
 * Tests for lib/integrations/slack/notify.ts
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

import {
  sendSlackNotification,
  notifyGateApproval,
  notifyDeadlineWarning,
  notifyHitlPending,
  notifyPwinChange,
  notifyAssignment,
  listSlackChannels,
  createOpportunityChannel,
  linkChannelToOpportunity,
} from '@/lib/integrations/slack/notify'

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
          credentials_encrypted: JSON.stringify({ bot_token: 'xoxb-test' }),
        },
        error: null,
      })
    }
    return chain
  })
}

describe('sendSlackNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await sendSlackNotification({
      type: 'gate_approval',
      opportunityId: 'o1',
      opportunityTitle: 'Test',
      channelId: 'C123',
      data: { gateName: 'G1', pwin: 70, compliancePercent: 85 },
    })
    expect(result.success).toBe(false)
  })

  it('sends message successfully', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, ts: '123.456' }),
    })

    const result = await sendSlackNotification({
      type: 'gate_approval',
      opportunityId: 'o1',
      opportunityTitle: 'Test Opp',
      channelId: 'C123',
      data: { gateName: 'Gate 1', pwin: 70, compliancePercent: 85 },
    })
    expect(result.success).toBe(true)
    expect(result.messageTs).toBe('123.456')
  })

  it('handles Slack API error', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: false, error: 'channel_not_found' }),
    })

    const result = await sendSlackNotification({
      type: 'deadline_warning',
      opportunityId: 'o1',
      opportunityTitle: 'T',
      channelId: 'bad',
      data: { deadlineDate: '2026-12-31', hoursRemaining: 24 },
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('channel_not_found')
  })

  it('handles network error', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('timeout'))

    const result = await sendSlackNotification({
      type: 'hitl_pending',
      opportunityId: 'o1',
      opportunityTitle: 'T',
      channelId: 'C1',
      data: { taskDescription: 'Review', agentName: 'Agent' },
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('timeout')
  })
})

describe('convenience notification methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  it('notifyGateApproval delegates to sendSlackNotification', async () => {
    const result = await notifyGateApproval('C1', 'o1', 'Opp', 'Gate 1', 75, 90)
    expect(result.success).toBe(false) // not connected
  })

  it('notifyDeadlineWarning works', async () => {
    const result = await notifyDeadlineWarning('C1', 'o1', 'Opp', '2026-12-31', 48)
    expect(result.success).toBe(false)
  })

  it('notifyHitlPending works', async () => {
    const result = await notifyHitlPending('C1', 'o1', 'Opp', 'Review doc', 'ComplianceBot')
    expect(result.success).toBe(false)
  })

  it('notifyPwinChange works', async () => {
    const result = await notifyPwinChange('C1', 'o1', 'Opp', 50, 65)
    expect(result.success).toBe(false)
  })

  it('notifyAssignment works', async () => {
    const result = await notifyAssignment('C1', 'o1', 'Opp', 'Jane', 'Capture Manager')
    expect(result.success).toBe(false)
  })
})

describe('notification block types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('sends pwin_change notification with trend blocks', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, ts: '1' }),
    })

    const result = await sendSlackNotification({
      type: 'pwin_change',
      opportunityId: 'o1',
      opportunityTitle: 'T',
      channelId: 'C1',
      data: { oldPwin: 50, newPwin: 65 },
    })
    expect(result.success).toBe(true)
  })

  it('sends assignment notification', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, ts: '2' }),
    })

    const result = await sendSlackNotification({
      type: 'assignment',
      opportunityId: 'o1',
      opportunityTitle: 'T',
      channelId: 'C1',
      data: { assigneeName: 'Bob', role: 'Writer' },
    })
    expect(result.success).toBe(true)
  })

  it('sends deadline warning with <=24hr emoji', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, ts: '3' }),
    })

    const result = await sendSlackNotification({
      type: 'deadline_warning',
      opportunityId: 'o1',
      opportunityTitle: 'T',
      channelId: 'C1',
      data: { deadlineDate: '2026-12-31', hoursRemaining: 20 },
    })
    expect(result.success).toBe(true)
  })
})

describe('listSlackChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns empty when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await listSlackChannels()
    expect(result.channels).toEqual([])
  })

  it('returns channels on success', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ok: true,
        channels: [
          { id: 'C1', name: 'general' },
          { id: 'C2', name: 'proposals' },
        ],
      }),
    })

    const result = await listSlackChannels()
    expect(result.channels).toHaveLength(2)
  })
})

describe('createOpportunityChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns null when not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await createOpportunityChannel('Test Opp')
    expect(result.channelId).toBeNull()
  })

  it('creates channel successfully', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, channel: { id: 'C-NEW' } }),
    })

    const result = await createOpportunityChannel('Test Opp')
    expect(result.channelId).toBe('C-NEW')
  })

  it('handles name_taken error', async () => {
    setupConnected()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: false, error: 'name_taken' }),
    })

    const result = await createOpportunityChannel('Test Opp')
    expect(result.channelId).toBeNull()
    expect(result.error).toContain('already exists')
  })
})

describe('linkChannelToOpportunity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await linkChannelToOpportunity('o1', 'C1')
    expect(result.success).toBe(false)
  })
})
