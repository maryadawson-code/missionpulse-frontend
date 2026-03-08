import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logging/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

import {
  timedQuery,
  getSlowQueries,
  clearSlowQueries,
  getQueryStats,
} from '@/lib/utils/query-logger'

describe('query-logger', () => {
  beforeEach(() => {
    clearSlowQueries()
  })

  describe('timedQuery', () => {
    it('returns query result with duration', async () => {
      const result = await timedQuery('test_table', 'select', async () => ({
        data: [{ id: 1 }],
        error: null,
      }))

      expect(result.data).toEqual([{ id: 1 }])
      expect(result.error).toBeNull()
      expect(typeof result.duration_ms).toBe('number')
    })

    it('buffers slow queries (mocked as instant, so no slow query)', async () => {
      await timedQuery('fast_table', 'select', async () => ({
        data: [],
        error: null,
      }))

      // Since the query is instant, it won't be slow
      expect(getSlowQueries()).toHaveLength(0)
    })
  })

  describe('getSlowQueries', () => {
    it('returns empty array initially', () => {
      expect(getSlowQueries()).toEqual([])
    })

    it('returns a copy of the buffer', () => {
      const queries = getSlowQueries()
      expect(queries).toEqual([])
      // Pushing to the copy shouldn't affect the internal buffer
      queries.push({} as never)
      expect(getSlowQueries()).toEqual([])
    })
  })

  describe('clearSlowQueries', () => {
    it('clears the buffer', () => {
      clearSlowQueries()
      expect(getSlowQueries()).toHaveLength(0)
    })
  })

  describe('getQueryStats', () => {
    it('returns zeros when no slow queries', () => {
      const stats = getQueryStats()
      expect(stats.total_slow_queries).toBe(0)
      expect(stats.avg_duration_ms).toBe(0)
      expect(stats.slowest_table).toBeNull()
      expect(stats.slowest_duration_ms).toBe(0)
    })
  })
})
