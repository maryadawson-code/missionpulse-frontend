import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPwin,
  formatDate,
  formatRelativeDate,
  pwinColor,
  phaseColor,
  statusColor,
} from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('formats a number as USD', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000')
  })
  it('returns — for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })
  it('returns — for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('formatCurrencyCompact', () => {
  it('formats large numbers compactly', () => {
    const result = formatCurrencyCompact(1500000)
    expect(result).toMatch(/\$1\.5M/)
  })
  it('returns — for null', () => {
    expect(formatCurrencyCompact(null)).toBe('—')
  })
  it('returns — for undefined', () => {
    expect(formatCurrencyCompact(undefined)).toBe('—')
  })
})

describe('formatPwin', () => {
  it('formats percentage', () => {
    expect(formatPwin(75)).toBe('75%')
  })
  it('formats zero', () => {
    expect(formatPwin(0)).toBe('0%')
  })
  it('returns — for null', () => {
    expect(formatPwin(null)).toBe('—')
  })
  it('returns — for undefined', () => {
    expect(formatPwin(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-03-15T12:00:00Z')
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2026/)
    // Day could vary by timezone; just ensure it's a non-empty date string
    expect(result.length).toBeGreaterThan(5)
  })
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—')
  })
  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatRelativeDate', () => {
  it('returns — for null', () => {
    expect(formatRelativeDate(null)).toBe('—')
  })
  it('returns Today for today', () => {
    const today = new Date().toISOString()
    expect(formatRelativeDate(today)).toBe('Today')
  })
  it('returns Tomorrow for +1 day', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString()
    expect(formatRelativeDate(tomorrow)).toBe('Tomorrow')
  })
  it('returns Yesterday for -1 day', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    expect(formatRelativeDate(yesterday)).toBe('Yesterday')
  })
  it('returns "in X days" for near future', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString()
    const result = formatRelativeDate(future)
    expect(result).toMatch(/in \d+ days/)
  })
  it('returns "X days ago" for near past', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString()
    const result = formatRelativeDate(past)
    expect(result).toMatch(/\d+ days ago/)
  })
  it('falls back to formatted date for far future', () => {
    const farFuture = new Date(Date.now() + 60 * 86400000).toISOString()
    const result = formatRelativeDate(farFuture)
    expect(result).not.toMatch(/in \d+ days/)
  })
})

describe('pwinColor', () => {
  it('returns gray for null', () => {
    expect(pwinColor(null)).toContain('gray')
  })
  it('returns emerald for >= 70', () => {
    expect(pwinColor(70)).toContain('emerald')
    expect(pwinColor(100)).toContain('emerald')
  })
  it('returns amber for 40-69', () => {
    expect(pwinColor(40)).toContain('amber')
    expect(pwinColor(69)).toContain('amber')
  })
  it('returns red for < 40', () => {
    expect(pwinColor(0)).toContain('red')
    expect(pwinColor(39)).toContain('red')
  })
})

describe('phaseColor', () => {
  it('returns gray for null', () => {
    expect(phaseColor(null)).toContain('gray')
  })
  it('returns blue for capture phase', () => {
    expect(phaseColor('capture')).toContain('blue')
  })
  it('returns cyan for proposal phase', () => {
    expect(phaseColor('proposal')).toContain('cyan')
  })
  it('returns emerald for submit phase', () => {
    expect(phaseColor('final review')).toContain('emerald')
  })
  it('returns purple for post-award', () => {
    expect(phaseColor('post-award')).toContain('purple')
  })
  it('returns default for unknown phase', () => {
    expect(phaseColor('unknown')).toContain('gray')
  })
})

describe('statusColor', () => {
  it('returns gray for null', () => {
    expect(statusColor(null)).toContain('gray')
  })
  it('returns emerald for active', () => {
    expect(statusColor('active')).toContain('emerald')
    expect(statusColor('Active')).toContain('emerald')
    expect(statusColor('open')).toContain('emerald')
  })
  it('returns cyan for won', () => {
    expect(statusColor('won')).toContain('cyan')
    expect(statusColor('Won')).toContain('cyan')
  })
  it('returns red for lost', () => {
    expect(statusColor('lost')).toContain('red')
    expect(statusColor('Lost')).toContain('red')
  })
  it('returns gray for no-go', () => {
    expect(statusColor('no-go')).toContain('gray-800')
  })
  it('returns amber for submitted', () => {
    expect(statusColor('submitted')).toContain('amber')
  })
  it('returns default for unknown', () => {
    expect(statusColor('other')).toContain('gray')
  })
})
