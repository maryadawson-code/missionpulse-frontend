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
    or: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
  for (const k of Object.keys(c)) { if (!overrides[k]) c[k] = vi.fn().mockReturnValue(c) }
  Object.assign(c, overrides)
  return c
}

import { searchPlaybookEntries } from '@/lib/utils/embeddings'

describe('searchPlaybookEntries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty for blank query', async () => {
    expect(await searchPlaybookEntries('')).toEqual([])
    expect(await searchPlaybookEntries('   ')).toEqual([])
  })

  it('returns matching IDs', async () => {
    const c = makeChain()
    c.limit = vi.fn().mockResolvedValue({ data: [{ id: 'e1' }, { id: 'e2' }], error: null })
    mockFrom.mockReturnValue(c)
    const result = await searchPlaybookEntries('compliance')
    expect(result).toEqual(['e1', 'e2'])
  })

  it('returns empty on error', async () => {
    const c = makeChain()
    c.limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
    mockFrom.mockReturnValue(c)
    expect(await searchPlaybookEntries('test')).toEqual([])
  })

  it('applies category filter', async () => {
    const c = makeChain()
    c.eq = vi.fn().mockResolvedValue({ data: [{ id: 'e3' }], error: null })
    c.limit = vi.fn().mockReturnValue(c)
    mockFrom.mockReturnValue(c)
    const result = await searchPlaybookEntries('test', { category: 'pricing' })
    expect(result).toEqual(['e3'])
  })

  it('respects limit option', async () => {
    const c = makeChain()
    c.limit = vi.fn().mockResolvedValue({ data: [{ id: 'e1' }], error: null })
    mockFrom.mockReturnValue(c)
    await searchPlaybookEntries('test', { limit: 5 })
    expect(c.limit).toHaveBeenCalledWith(5)
  })
})
