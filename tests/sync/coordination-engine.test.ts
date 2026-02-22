// filepath: tests/sync/coordination-engine.test.ts
/**
 * Tests for coordination-engine.ts — Coordination Transform Logic
 * v1.3 Sprint 31
 *
 * Tests the four transform types used by the cross-document coordination engine:
 *   - copy: Direct value replication
 *   - format: Apply formatting (currency, date, string)
 *   - reference: Insert a cross-reference pointer
 *   - aggregate: Sum numeric values from an array
 *
 * Since applyTransform is a private function in coordination-engine.ts,
 * these tests replicate the transform logic inline to verify the expected
 * behavior contracts that the engine depends on.
 */

import type { CoordinationTransform } from '@/lib/types/sync'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

// ─── Replicated transform logic (mirrors coordination-engine.ts applyTransform)

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

// ─── Test 1: Copy transform returns exact value ──────────────

function testCopyTransform(): TestResult {
  try {
    const original = { key: 'value', nested: { deep: true } }
    const result = applyTransform('copy', original, 'target.field')

    if (result !== original) {
      return {
        name: 'testCopyTransform',
        passed: false,
        error: 'Copy transform should return the exact same reference',
      }
    }

    // Test with primitive value
    const numResult = applyTransform('copy', 42, 'target.number')
    if (numResult !== 42) {
      return {
        name: 'testCopyTransform',
        passed: false,
        error: `Expected copy of 42 to return 42, got ${numResult}`,
      }
    }

    // Test with string
    const strResult = applyTransform('copy', 'hello', 'target.string')
    if (strResult !== 'hello') {
      return {
        name: 'testCopyTransform',
        passed: false,
        error: `Expected copy of 'hello' to return 'hello', got '${strResult}'`,
      }
    }

    // Test with null
    const nullResult = applyTransform('copy', null, 'target.null')
    if (nullResult !== null) {
      return {
        name: 'testCopyTransform',
        passed: false,
        error: `Expected copy of null to return null, got ${nullResult}`,
      }
    }

    return { name: 'testCopyTransform', passed: true }
  } catch (err) {
    return {
      name: 'testCopyTransform',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 2: Format transform stringifies value ──────────────

function testFormatTransform(): TestResult {
  try {
    // Number → formatted currency string
    const currencyResult = applyTransform('format', 5000000, 'pricing.total')
    if (typeof currencyResult !== 'string') {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected string result for number formatting, got ${typeof currencyResult}`,
      }
    }
    // Should contain "$" and "5,000,000"
    const currencyStr = currencyResult as string
    if (!currencyStr.includes('$') || !currencyStr.includes('5,000,000')) {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected currency format like "$5,000,000", got "${currencyStr}"`,
      }
    }

    // Date → ISO string
    const testDate = new Date('2026-03-15T12:00:00Z')
    const dateResult = applyTransform('format', testDate, 'meta.date')
    if (typeof dateResult !== 'string') {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected string result for Date formatting, got ${typeof dateResult}`,
      }
    }
    if (!(dateResult as string).includes('2026-03-15')) {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected date ISO string to include '2026-03-15', got "${dateResult}"`,
      }
    }

    // String passthrough
    const strResult = applyTransform('format', 'plain text', 'meta.label')
    if (strResult !== 'plain text') {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected format of string to return same string, got "${strResult}"`,
      }
    }

    // Null → empty string
    const nullResult = applyTransform('format', null, 'meta.empty')
    if (nullResult !== '') {
      return {
        name: 'testFormatTransform',
        passed: false,
        error: `Expected format of null to return empty string, got "${nullResult}"`,
      }
    }

    return { name: 'testFormatTransform', passed: true }
  } catch (err) {
    return {
      name: 'testFormatTransform',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 3: Reference transform creates a reference object ──

function testReferenceTransform(): TestResult {
  try {
    const result = applyTransform('reference', 'DOC-001', 'cross_ref.source')

    if (typeof result !== 'string') {
      return {
        name: 'testReferenceTransform',
        passed: false,
        error: `Expected string result, got ${typeof result}`,
      }
    }

    const refStr = result as string
    if (refStr !== '[ref:DOC-001]') {
      return {
        name: 'testReferenceTransform',
        passed: false,
        error: `Expected '[ref:DOC-001]', got '${refStr}'`,
      }
    }

    // Test with null value
    const nullRef = applyTransform('reference', null, 'cross_ref.empty')
    if (nullRef !== '[ref:]') {
      return {
        name: 'testReferenceTransform',
        passed: false,
        error: `Expected '[ref:]' for null input, got '${nullRef}'`,
      }
    }

    // Test with numeric value
    const numRef = applyTransform('reference', 12345, 'cross_ref.number')
    if (numRef !== '[ref:12345]') {
      return {
        name: 'testReferenceTransform',
        passed: false,
        error: `Expected '[ref:12345]', got '${numRef}'`,
      }
    }

    return { name: 'testReferenceTransform', passed: true }
  } catch (err) {
    return {
      name: 'testReferenceTransform',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Test 4: Aggregate transform sums numeric array ──────────

function testAggregateTransform(): TestResult {
  try {
    // Sum of numeric array
    const numericArray = [100, 200, 300, 400]
    const sumResult = applyTransform('aggregate', numericArray, 'pricing.subtotals')

    if (sumResult !== 1000) {
      return {
        name: 'testAggregateTransform',
        passed: false,
        error: `Expected sum=1000, got ${sumResult}`,
      }
    }

    // Mixed array with strings that are numeric
    const mixedArray = [100, '200', 300]
    const mixedResult = applyTransform('aggregate', mixedArray, 'pricing.mixed')

    if (mixedResult !== 600) {
      return {
        name: 'testAggregateTransform',
        passed: false,
        error: `Expected sum=600 for mixed numeric/string array, got ${mixedResult}`,
      }
    }

    // Array with non-numeric strings (should be treated as 0)
    const invalidArray = [100, 'not-a-number', 200]
    const invalidResult = applyTransform('aggregate', invalidArray, 'pricing.invalid')

    if (invalidResult !== 300) {
      return {
        name: 'testAggregateTransform',
        passed: false,
        error: `Expected sum=300 (NaN treated as 0), got ${invalidResult}`,
      }
    }

    // Empty array
    const emptyResult = applyTransform('aggregate', [], 'pricing.empty')
    if (emptyResult !== 0) {
      return {
        name: 'testAggregateTransform',
        passed: false,
        error: `Expected sum=0 for empty array, got ${emptyResult}`,
      }
    }

    // Non-array input should be passed through
    const nonArray = applyTransform('aggregate', 42, 'pricing.scalar')
    if (nonArray !== 42) {
      return {
        name: 'testAggregateTransform',
        passed: false,
        error: `Expected non-array value to pass through as 42, got ${nonArray}`,
      }
    }

    return { name: 'testAggregateTransform', passed: true }
  } catch (err) {
    return {
      name: 'testAggregateTransform',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Export all tests ────────────────────────────────────────

export const tests = [
  testCopyTransform,
  testFormatTransform,
  testReferenceTransform,
  testAggregateTransform,
]
