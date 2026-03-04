import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn() — class name merger', () => {
  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles conditional classes via clsx syntax', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('merges array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})
