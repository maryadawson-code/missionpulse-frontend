import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  it('formats a number as USD currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('returns dash for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
  })
})

describe('formatCurrencyCompact', () => {
  it('formats large numbers compactly', () => {
    const result = formatCurrencyCompact(1200000)
    expect(result).toMatch(/\$1\.2M/)
  })

  it('returns dash for null/undefined', () => {
    expect(formatCurrencyCompact(null)).toBe('—')
    expect(formatCurrencyCompact(undefined)).toBe('—')
  })
})

describe('formatPwin', () => {
  it('formats as percentage', () => {
    expect(formatPwin(75)).toBe('75%')
    expect(formatPwin(0)).toBe('0%')
  })

  it('returns dash for null/undefined', () => {
    expect(formatPwin(null)).toBe('—')
    expect(formatPwin(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats ISO date string to short date', () => {
    const result = formatDate('2025-01-15T12:00:00Z')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2025/)
  })

  it('returns dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatRelativeDate', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-06-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    nowSpy.mockRestore()
  })

  it('returns Today for same day', () => {
    expect(formatRelativeDate('2025-06-15T12:00:00Z')).toBe('Today')
  })

  it('returns Tomorrow for +1 day', () => {
    expect(formatRelativeDate('2025-06-16T12:00:00Z')).toBe('Tomorrow')
  })

  it('returns Yesterday for -1 day', () => {
    expect(formatRelativeDate('2025-06-14T12:00:00Z')).toBe('Yesterday')
  })

  it('returns "in X days" for future', () => {
    expect(formatRelativeDate('2025-06-20T12:00:00Z')).toBe('in 5 days')
  })

  it('returns "X days ago" for past', () => {
    expect(formatRelativeDate('2025-06-10T12:00:00Z')).toBe('5 days ago')
  })

  it('falls back to formatted date beyond 30 days', () => {
    const result = formatRelativeDate('2025-08-15T12:00:00Z')
    expect(result).toMatch(/Aug/)
  })

  it('returns dash for null/undefined', () => {
    expect(formatRelativeDate(null)).toBe('—')
    expect(formatRelativeDate(undefined)).toBe('—')
  })
})

describe('pwinColor', () => {
  it('returns emerald for >= 70', () => {
    expect(pwinColor(70)).toBe('text-emerald-400')
    expect(pwinColor(100)).toBe('text-emerald-400')
  })

  it('returns amber for >= 40', () => {
    expect(pwinColor(40)).toBe('text-amber-400')
    expect(pwinColor(69)).toBe('text-amber-400')
  })

  it('returns red for < 40', () => {
    expect(pwinColor(39)).toBe('text-red-400')
    expect(pwinColor(0)).toBe('text-red-400')
  })

  it('returns gray for null/undefined', () => {
    expect(pwinColor(null)).toBe('text-gray-400')
    expect(pwinColor(undefined)).toBe('text-gray-400')
  })
})

describe('phaseColor', () => {
  it('returns blue for capture phase', () => {
    expect(phaseColor('Capture')).toContain('blue')
  })

  it('returns cyan for proposal phase', () => {
    expect(phaseColor('Proposal')).toContain('cyan')
  })

  it('returns emerald for submit/final phase', () => {
    expect(phaseColor('Submit')).toContain('emerald')
  })

  it('returns purple for post/award phase', () => {
    expect(phaseColor('Post-Award')).toContain('purple')
  })

  it('returns gray default for unknown phase', () => {
    expect(phaseColor('unknown')).toContain('gray')
  })

  it('returns gray for null/undefined', () => {
    expect(phaseColor(null)).toContain('gray')
    expect(phaseColor(undefined)).toContain('gray')
  })
})

describe('statusColor', () => {
  it('returns emerald for active/open', () => {
    expect(statusColor('active')).toContain('emerald')
    expect(statusColor('open')).toContain('emerald')
  })

  it('returns cyan for won', () => {
    expect(statusColor('won')).toContain('cyan')
  })

  it('returns red for lost', () => {
    expect(statusColor('lost')).toContain('red')
  })

  it('returns gray for no-go', () => {
    expect(statusColor('no-go')).toContain('gray')
    expect(statusColor('no_go')).toContain('gray')
  })

  it('returns amber for submitted', () => {
    expect(statusColor('submitted')).toContain('amber')
  })

  it('returns gray default for unknown', () => {
    expect(statusColor('whatever')).toContain('gray')
  })

  it('returns gray for null/undefined', () => {
    expect(statusColor(null)).toContain('gray')
    expect(statusColor(undefined)).toContain('gray')
  })
})
