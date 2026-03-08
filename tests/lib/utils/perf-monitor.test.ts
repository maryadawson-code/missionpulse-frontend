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
  recordMetric,
  withTiming,
  getOperationSummary,
  getAllSummaries,
  getEntries,
  clearMetrics,
} from '@/lib/utils/perf-monitor'

describe('perf-monitor', () => {
  beforeEach(() => {
    clearMetrics()
  })

  describe('recordMetric', () => {
    it('stores a metric entry', () => {
      recordMetric({
        operation: 'test.op',
        duration_ms: 100,
        timestamp: new Date().toISOString(),
      })

      const entries = getEntries('test.op')
      expect(entries).toHaveLength(1)
      expect(entries[0].duration_ms).toBe(100)
    })

    it('maintains sliding window of 500 entries', () => {
      for (let i = 0; i < 510; i++) {
        recordMetric({
          operation: 'test.op',
          duration_ms: i,
          timestamp: new Date().toISOString(),
        })
      }

      const entries = getEntries('test.op')
      expect(entries.length).toBeLessThanOrEqual(500)
    })
  })

  describe('withTiming', () => {
    it('times an async operation and records metric', async () => {
      const result = await withTiming('test.async', async () => {
        return 'hello'
      })

      expect(result).toBe('hello')
      const entries = getEntries('test.async')
      expect(entries).toHaveLength(1)
    })

    it('records metric even when fn throws', async () => {
      await expect(
        withTiming('test.error', async () => {
          throw new Error('fail')
        })
      ).rejects.toThrow('fail')

      const entries = getEntries('test.error')
      expect(entries).toHaveLength(1)
    })

    it('passes metadata through', async () => {
      await withTiming('test.meta', async () => 42, { key: 'val' })
      const entries = getEntries('test.meta')
      expect(entries[0].metadata).toEqual({ key: 'val' })
    })
  })

  describe('getOperationSummary', () => {
    it('returns null for unknown operation', () => {
      expect(getOperationSummary('nonexistent')).toBeNull()
    })

    it('returns summary with correct stats', () => {
      for (const d of [10, 20, 30, 40, 50]) {
        recordMetric({ operation: 'test.summary', duration_ms: d, timestamp: new Date().toISOString() })
      }

      const summary = getOperationSummary('test.summary')
      expect(summary).not.toBeNull()
      expect(summary!.count).toBe(5)
      expect(summary!.min_ms).toBe(10)
      expect(summary!.max_ms).toBe(50)
      expect(summary!.avg_ms).toBe(30)
    })
  })

  describe('getAllSummaries', () => {
    it('returns summaries for all operations sorted by p95', () => {
      recordMetric({ operation: 'fast', duration_ms: 10, timestamp: new Date().toISOString() })
      recordMetric({ operation: 'slow', duration_ms: 5000, timestamp: new Date().toISOString() })

      const summaries = getAllSummaries()
      expect(summaries).toHaveLength(2)
      expect(summaries[0].operation).toBe('slow')
    })

    it('returns empty array when no metrics', () => {
      expect(getAllSummaries()).toEqual([])
    })
  })

  describe('getEntries', () => {
    it('returns empty array for unknown operation', () => {
      expect(getEntries('nope')).toEqual([])
    })

    it('returns a copy (not the internal array)', () => {
      recordMetric({ operation: 'test.copy', duration_ms: 1, timestamp: new Date().toISOString() })
      const entries = getEntries('test.copy')
      entries.push({ operation: 'test.copy', duration_ms: 999, timestamp: '' })
      expect(getEntries('test.copy')).toHaveLength(1)
    })
  })

  describe('clearMetrics', () => {
    it('removes all metrics', () => {
      recordMetric({ operation: 'a', duration_ms: 1, timestamp: '' })
      recordMetric({ operation: 'b', duration_ms: 2, timestamp: '' })
      clearMetrics()
      expect(getAllSummaries()).toEqual([])
    })
  })
})
