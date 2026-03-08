import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
const mockSingle = vi.fn().mockResolvedValue({ data: { company_id: 'co-1' }, error: null })

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })) }
      }
      return { insert: mockInsert, update: mockUpdate }
    }),
  }),
}))

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logNotification inserts a notification', async () => {
    const { logNotification } = await import('@/lib/utils/notifications')
    await logNotification({
      userId: 'user-1',
      title: 'Deadline approaching',
      message: 'Due in 3 days',
      notificationType: 'deadline',
    })
    expect(mockInsert).toHaveBeenCalled()
  })

  it('logNotification sets default priority to normal', async () => {
    const { logNotification } = await import('@/lib/utils/notifications')
    await logNotification({
      userId: 'user-1',
      title: 'Test',
      message: 'Test msg',
      notificationType: 'test',
    })
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.priority).toBe('normal')
  })

  it('logNotification accepts custom priority', async () => {
    const { logNotification } = await import('@/lib/utils/notifications')
    await logNotification({
      userId: 'user-1',
      title: 'Urgent',
      message: 'Act now',
      notificationType: 'alert',
      priority: 'urgent',
    })
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.priority).toBe('urgent')
  })

  it('logNotification does not throw on error', async () => {
    mockSingle.mockRejectedValueOnce(new Error('DB down'))
    const { logNotification } = await import('@/lib/utils/notifications')
    await expect(logNotification({
      userId: 'user-1',
      title: 'Test',
      message: 'Test',
      notificationType: 'test',
    })).resolves.toBeUndefined()
  })

  it('markNotificationRead updates notification', async () => {
    const { markNotificationRead } = await import('@/lib/utils/notifications')
    await markNotificationRead('notif-1')
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('dismissNotification updates notification', async () => {
    const { dismissNotification } = await import('@/lib/utils/notifications')
    await dismissNotification('notif-1')
    expect(mockUpdate).toHaveBeenCalled()
  })
})
