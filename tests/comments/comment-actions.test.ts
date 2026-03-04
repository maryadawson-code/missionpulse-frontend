// filepath: tests/comments/comment-actions.test.ts
/**
 * Tests for comment edit/delete server actions.
 * v1.9 Sprint 52 T-52.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../fixtures/supabase'

// Mock Supabase server client
const mockProfile = { id: 'user-1', full_name: 'Mary W', company_id: 'co-1' }
const mockSection = { opportunity_id: 'opp-1', section_title: 'Executive Summary' }

let mockClient: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => {
    return Promise.resolve(mockClient.client)
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('editComment', () => {
  it('succeeds when user is the comment author', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: mockProfile,
    })

    // Override the specific chain calls for profile, section, and author verification
    const profileResult = { data: mockProfile, error: null }
    const sectionResult = { data: mockSection, error: null }
    const originalEntries = {
      data: [
        { user_id: 'user-1', metadata: { comment_id: 'comment-1', content: 'old content' } },
      ],
      error: null,
    }

    let callCount = 0
    mockClient.queryBuilder.single.mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(profileResult)
      return Promise.resolve(sectionResult)
    })

    // Mock the order call for the author verification query
    mockClient.queryBuilder.order.mockImplementation(() => ({
      ...mockClient.queryBuilder,
      then: (resolve: (v: unknown) => void) => resolve(originalEntries),
    }))

    const { editComment } = await import('@/lib/comments/actions')
    const result = await editComment('section-1', 'comment-1', 'user-1', 'updated content')
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects edit when user is not the author', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-2', email: 'other@test.com' },
      queryData: mockProfile,
    })

    const profileResult = { data: { id: 'user-2', full_name: 'Other User', company_id: 'co-1' }, error: null }
    const sectionResult = { data: mockSection, error: null }
    const originalEntries = {
      data: [
        { user_id: 'user-1', metadata: { comment_id: 'comment-1', content: 'old content' } },
      ],
      error: null,
    }

    let callCount = 0
    mockClient.queryBuilder.single.mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(profileResult)
      return Promise.resolve(sectionResult)
    })

    mockClient.queryBuilder.order.mockImplementation(() => ({
      ...mockClient.queryBuilder,
      then: (resolve: (v: unknown) => void) => resolve(originalEntries),
    }))

    const { editComment } = await import('@/lib/comments/actions')
    const result = await editComment('section-1', 'comment-1', 'user-2', 'hacked content')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Only the comment author can edit')
  })

  it('returns error when user profile not found', async () => {
    mockClient = createMockSupabaseClient({
      user: null,
      queryData: null,
    })

    mockClient.queryBuilder.single.mockResolvedValue({ data: null, error: null })

    const { editComment } = await import('@/lib/comments/actions')
    const result = await editComment('section-1', 'comment-1', 'ghost-user', 'content')
    expect(result.success).toBe(false)
    expect(result.error).toBe('User not found')
  })
})

describe('deleteComment', () => {
  it('succeeds when user is the comment author', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-1', email: 'test@test.com' },
      queryData: mockProfile,
    })

    const profileResult = { data: mockProfile, error: null }
    const sectionResult = { data: mockSection, error: null }
    const originalEntries = {
      data: [
        { user_id: 'user-1', metadata: { comment_id: 'comment-1' } },
      ],
      error: null,
    }

    let callCount = 0
    mockClient.queryBuilder.single.mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(profileResult)
      return Promise.resolve(sectionResult)
    })

    mockClient.queryBuilder.order.mockImplementation(() => ({
      ...mockClient.queryBuilder,
      then: (resolve: (v: unknown) => void) => resolve(originalEntries),
    }))

    const { deleteComment } = await import('@/lib/comments/actions')
    const result = await deleteComment('section-1', 'comment-1', 'user-1')
    expect(result.success).toBe(true)
  })

  it('rejects delete when user is not the author', async () => {
    mockClient = createMockSupabaseClient({
      user: { id: 'user-2', email: 'other@test.com' },
      queryData: null,
    })

    const profileResult = { data: { id: 'user-2', full_name: 'Other User', company_id: 'co-1' }, error: null }
    const sectionResult = { data: mockSection, error: null }
    const originalEntries = {
      data: [
        { user_id: 'user-1', metadata: { comment_id: 'comment-1' } },
      ],
      error: null,
    }

    let callCount = 0
    mockClient.queryBuilder.single.mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(profileResult)
      return Promise.resolve(sectionResult)
    })

    mockClient.queryBuilder.order.mockImplementation(() => ({
      ...mockClient.queryBuilder,
      then: (resolve: (v: unknown) => void) => resolve(originalEntries),
    }))

    const { deleteComment } = await import('@/lib/comments/actions')
    const result = await deleteComment('section-1', 'comment-1', 'user-2')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Only the comment author can delete')
  })

  it('returns error when user profile not found', async () => {
    mockClient = createMockSupabaseClient({
      user: null,
      queryData: null,
    })

    mockClient.queryBuilder.single.mockResolvedValue({ data: null, error: null })

    const { deleteComment } = await import('@/lib/comments/actions')
    const result = await deleteComment('section-1', 'comment-1', 'ghost-user')
    expect(result.success).toBe(false)
    expect(result.error).toBe('User not found')
  })
})
