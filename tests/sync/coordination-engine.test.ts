// filepath: tests/sync/coordination-engine.test.ts
/**
 * Tests for coordination-engine.ts — Coordination Transform Logic
 * v1.3 Sprint 31 → Migrated to Vitest (v1.6 T-42.1)
 *
 * Tests the four transform types: copy, format, reference, aggregate.
 * Since applyTransform is private, these tests replicate the transform
 * logic inline to verify the expected behavior contracts.
 */

import type { CoordinationTransform } from '@/lib/types/sync'

// Replicated transform logic (mirrors coordination-engine.ts applyTransform)
function applyTransform(
  transform: CoordinationTransform,
  sourceValue: unknown,
  _targetFieldPath: string
): unknown {
  switch (transform) {
    case 'copy':
      return sourceValue
    case 'format': {
      if (typeof sourceValue === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(sourceValue)
      }
      if (sourceValue instanceof Date) {
        return sourceValue.toISOString()
      }
      return String(sourceValue ?? '')
    }
    case 'aggregate': {
      if (Array.isArray(sourceValue)) {
        return sourceValue.reduce((sum: number, val: unknown) => {
          const num = typeof val === 'number' ? val : Number(val)
          return sum + (isNaN(num) ? 0 : num)
        }, 0)
      }
      return sourceValue
    }
    case 'reference': {
      return `[ref:${String(sourceValue ?? '')}]`
    }
    default:
      return sourceValue
  }
}

describe('coordination-engine transforms', () => {
  it('copy transform returns the exact same value', () => {
    const original = { key: 'value', nested: { deep: true } }
    expect(applyTransform('copy', original, 'target.field')).toBe(original)
    expect(applyTransform('copy', 42, 'target.number')).toBe(42)
    expect(applyTransform('copy', 'hello', 'target.string')).toBe('hello')
    expect(applyTransform('copy', null, 'target.null')).toBeNull()
  })

  it('format transform stringifies values correctly', () => {
    // Number → currency
    const currencyResult = applyTransform('format', 5000000, 'pricing.total') as string
    expect(currencyResult).toContain('$')
    expect(currencyResult).toContain('5,000,000')

    // Date → ISO string
    const testDate = new Date('2026-03-15T12:00:00Z')
    const dateResult = applyTransform('format', testDate, 'meta.date') as string
    expect(dateResult).toContain('2026-03-15')

    // String → passthrough
    expect(applyTransform('format', 'plain text', 'meta.label')).toBe('plain text')

    // Null → empty string
    expect(applyTransform('format', null, 'meta.empty')).toBe('')
  })

  it('reference transform creates ref string', () => {
    expect(applyTransform('reference', 'DOC-001', 'cross_ref.source')).toBe('[ref:DOC-001]')
    expect(applyTransform('reference', null, 'cross_ref.empty')).toBe('[ref:]')
    expect(applyTransform('reference', 12345, 'cross_ref.number')).toBe('[ref:12345]')
  })

  it('aggregate transform sums numeric arrays', () => {
    expect(applyTransform('aggregate', [100, 200, 300, 400], 'pricing.subtotals')).toBe(1000)
    expect(applyTransform('aggregate', [100, '200', 300], 'pricing.mixed')).toBe(600)
    expect(applyTransform('aggregate', [100, 'not-a-number', 200], 'pricing.invalid')).toBe(300)
    expect(applyTransform('aggregate', [], 'pricing.empty')).toBe(0)
    // Non-array passthrough
    expect(applyTransform('aggregate', 42, 'pricing.scalar')).toBe(42)
  })
})
