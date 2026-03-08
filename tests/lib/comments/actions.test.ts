import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = { from: mockFrom }
  return { mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn().mockResolvedValue(mockSupabase) }))

function makeChain(overrides: Record<string, unknown> = {}) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { addComment, getComments, resolveComment, editComment, deleteComment, getCommentCount } from '@/lib/comments/actions'

describe('addComment', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when user not found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    const r = await addComment('s1', 'u1', 'test')
    expect(r.comment).toBeNull()
    expect(r.error).toBe('User not found')
  })
  it('creates a comment', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { id: 'u1', full_name: 'Jane', role: 'analyst', company_id: 'c1' }, error: null }) })
      if (n === 2) return makeChain({ single: vi.fn().mockResolvedValue({ data: { opportunity_id: 'o1', section_title: 'S' }, error: null }) })
      return makeChain()
    })
    const r = await addComment('s1', 'u1', 'Good work!')
    expect(r.comment).not.toBeNull()
    expect(r.comment!.content).toBe('Good work!')
  })
})

describe('getComments', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns empty when no entries', async () => {
    mockFrom.mockReturnValue(makeChain({ order: vi.fn().mockResolvedValue({ data: [] }) }))
    expect(await getComments('s1')).toEqual([])
  })
  it('builds comment tree', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({
        order: vi.fn().mockResolvedValue({
          data: [
            { action_type: 'comment_added', user_id: 'u1', user_name: 'Jane', created_at: '2025-01-01', metadata: { comment_id: 'c1', parent_id: null, content: 'Root', resolved: false } },
            { action_type: 'comment_reply', user_id: 'u2', user_name: 'Bob', created_at: '2025-01-02', metadata: { comment_id: 'c2', parent_id: 'c1', content: 'Reply', resolved: false } },
          ],
        }),
      })
      return makeChain({ in: vi.fn().mockResolvedValue({ data: [{ id: 'u1', full_name: 'Jane', role: 'a' }, { id: 'u2', full_name: 'Bob', role: 'm' }] }) })
    })
    const r = await getComments('s1')
    expect(r).toHaveLength(1)
    expect(r[0].replies).toHaveLength(1)
  })
})

describe('resolveComment', () => {
  beforeEach(() => vi.clearAllMocks())
  it('inserts resolve event', async () => {
    mockFrom.mockReturnValue(makeChain())
    expect(await resolveComment('s1', 'c1', 'u1', true)).toEqual({ success: true })
  })
})

describe('editComment', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when user not found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await editComment('s1', 'c1', 'u1', 'Updated')).toEqual({ success: false, error: 'User not found' })
  })
  it('returns error when not author', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { full_name: 'Jane', company_id: 'c1' }, error: null }) })
      if (n === 2) return makeChain({ single: vi.fn().mockResolvedValue({ data: { opportunity_id: 'o1', section_title: 'S' }, error: null }) })
      return makeChain({ order: vi.fn().mockResolvedValue({ data: [{ user_id: 'other', metadata: { comment_id: 'c1' } }] }) })
    })
    expect(await editComment('s1', 'c1', 'u1', 'Updated')).toEqual({ success: false, error: 'Only the comment author can edit' })
  })
  it('edits when author', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { full_name: 'Jane', company_id: 'c1' }, error: null }) })
      if (n === 2) return makeChain({ single: vi.fn().mockResolvedValue({ data: { opportunity_id: 'o1', section_title: 'S' }, error: null }) })
      if (n === 3) return makeChain({ order: vi.fn().mockResolvedValue({ data: [{ user_id: 'u1', metadata: { comment_id: 'c1' } }] }) })
      return makeChain()
    })
    expect(await editComment('s1', 'c1', 'u1', 'Updated')).toEqual({ success: true })
  })
})

describe('deleteComment', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns error when not found', async () => {
    mockFrom.mockReturnValue(makeChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }))
    expect(await deleteComment('s1', 'c1', 'u1')).toEqual({ success: false, error: 'User not found' })
  })
  it('deletes when author', async () => {
    let n = 0
    mockFrom.mockImplementation(() => {
      n++
      if (n === 1) return makeChain({ single: vi.fn().mockResolvedValue({ data: { full_name: 'Jane', company_id: 'c1' }, error: null }) })
      if (n === 2) return makeChain({ single: vi.fn().mockResolvedValue({ data: { opportunity_id: 'o1', section_title: 'S' }, error: null }) })
      if (n === 3) return makeChain({ order: vi.fn().mockResolvedValue({ data: [{ user_id: 'u1', metadata: { comment_id: 'c1' } }] }) })
      return makeChain()
    })
    expect(await deleteComment('s1', 'c1', 'u1')).toEqual({ success: true })
  })
})

describe('getCommentCount', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns count', async () => {
    mockFrom.mockReturnValue(makeChain({ in: vi.fn().mockResolvedValue({ count: 5 }) }))
    expect(await getCommentCount('s1')).toBe(5)
  })
  it('returns 0 when null', async () => {
    mockFrom.mockReturnValue(makeChain({ in: vi.fn().mockResolvedValue({ count: null }) }))
    expect(await getCommentCount('s1')).toBe(0)
  })
})
