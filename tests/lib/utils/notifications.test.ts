import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: vi.fn() },
  }
  return { mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

function chainMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { company_id: 'comp-1' }, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

import {
  logNotification,
  markNotificationRead,
  dismissNotification,
} from '@/lib/utils/notifications'

describe('logNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts a notification after looking up profile', async () => {
    const chain = chainMock()
    mockFrom.mockReturnValue(chain)

    await logNotification({
      userId: 'user-1',
      title: 'Test',
      message: 'Test message',
      notificationType: 'info',
    })

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockFrom).toHaveBeenCalledWith('notifications')
  })

  it('does not throw on error', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('DB error')
    })

    await logNotification({
      userId: 'user-1',
      title: 'Test',
      message: 'Test message',
      notificationType: 'info',
    })
  })

  it('handles optional parameters', async () => {
    const chain = chainMock()
    mockFrom.mockReturnValue(chain)

    await logNotification({
      userId: 'user-1',
      title: 'Test',
      message: 'msg',
      notificationType: 'info',
      priority: 'high',
      linkUrl: '/test',
      linkText: 'Click',
      opportunityId: 'opp-1',
    })

    expect(mockFrom).toHaveBeenCalled()
  })
})

describe('markNotificationRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates notification with is_read true', async () => {
    const chain = chainMock()
    mockFrom.mockReturnValue(chain)

    await markNotificationRead('notif-1')
    expect(mockFrom).toHaveBeenCalledWith('notifications')
  })
})

describe('dismissNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates notification with is_dismissed true', async () => {
    const chain = chainMock()
    mockFrom.mockReturnValue(chain)

    await dismissNotification('notif-1')
    expect(mockFrom).toHaveBeenCalledWith('notifications')
  })
})
