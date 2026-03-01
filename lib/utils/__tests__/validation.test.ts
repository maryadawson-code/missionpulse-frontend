// filepath: lib/utils/__tests__/validation.test.ts
import {
  requiredString,
  optionalString,
  emailSchema,
  optionalUrl,
  dollarAmount,
  percentage,
  optionalDateString,
  naicsCode,
  contractNumber,
} from '@/lib/utils/validation'

describe('validation schemas', () => {
  describe('requiredString', () => {
    it('accepts non-empty trimmed string', () => {
      const schema = requiredString('Name')
      expect(schema.parse('hello')).toBe('hello')
    })

    it('trims whitespace', () => {
      const schema = requiredString('Name')
      expect(schema.parse('  hello  ')).toBe('hello')
    })

    it('rejects empty string', () => {
      const schema = requiredString('Name')
      expect(() => schema.parse('')).toThrow('Name is required')
    })

    it('rejects whitespace-only string', () => {
      const schema = requiredString('Title')
      expect(() => schema.parse('   ')).toThrow('Title is required')
    })
  })

  describe('optionalString', () => {
    it('trims and returns non-empty string', () => {
      expect(optionalString.parse('  hello  ')).toBe('hello')
    })

    it('transforms empty string to undefined', () => {
      expect(optionalString.parse('')).toBeUndefined()
    })

    it('accepts undefined', () => {
      expect(optionalString.parse(undefined)).toBeUndefined()
    })
  })

  describe('emailSchema', () => {
    it('accepts valid email', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com')
    })

    it('trims whitespace', () => {
      expect(emailSchema.parse('  user@example.com  ')).toBe('user@example.com')
    })

    it('rejects invalid email', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow('Invalid email')
    })
  })

  describe('optionalUrl', () => {
    it('accepts valid URL', () => {
      expect(optionalUrl.parse('https://example.com')).toBe('https://example.com')
    })

    it('transforms empty string to undefined', () => {
      expect(optionalUrl.parse('')).toBeUndefined()
    })

    it('accepts undefined', () => {
      expect(optionalUrl.parse(undefined)).toBeUndefined()
    })

    it('rejects invalid URL', () => {
      expect(() => optionalUrl.parse('not-a-url')).toThrow()
    })
  })

  describe('dollarAmount', () => {
    it('accepts positive number', () => {
      expect(dollarAmount.parse(1000)).toBe(1000)
    })

    it('accepts zero', () => {
      expect(dollarAmount.parse(0)).toBe(0)
    })

    it('coerces string to number', () => {
      expect(dollarAmount.parse('500')).toBe(500)
    })

    it('rejects negative number', () => {
      expect(() => dollarAmount.parse(-1)).toThrow('positive')
    })
  })

  describe('percentage', () => {
    it('accepts 0', () => {
      expect(percentage.parse(0)).toBe(0)
    })

    it('accepts 100', () => {
      expect(percentage.parse(100)).toBe(100)
    })

    it('accepts mid-range', () => {
      expect(percentage.parse(50)).toBe(50)
    })

    it('rejects > 100', () => {
      expect(() => percentage.parse(101)).toThrow('100 or less')
    })

    it('rejects negative', () => {
      expect(() => percentage.parse(-1)).toThrow('0 or greater')
    })
  })

  describe('optionalDateString', () => {
    it('accepts YYYY-MM-DD format', () => {
      expect(optionalDateString.parse('2026-03-15')).toBe('2026-03-15')
    })

    it('transforms empty to undefined', () => {
      expect(optionalDateString.parse('')).toBeUndefined()
    })

    it('rejects invalid format', () => {
      expect(() => optionalDateString.parse('03/15/2026')).toThrow('YYYY-MM-DD')
    })
  })

  describe('naicsCode', () => {
    it('accepts 6-digit code', () => {
      expect(naicsCode.parse('541512')).toBe('541512')
    })

    it('rejects 5-digit code', () => {
      expect(() => naicsCode.parse('54151')).toThrow('6 digits')
    })

    it('rejects non-numeric', () => {
      expect(() => naicsCode.parse('abcdef')).toThrow('6 digits')
    })
  })

  describe('contractNumber', () => {
    it('accepts valid contract number', () => {
      expect(contractNumber.parse('W52P1J-20-D-0001')).toBe('W52P1J-20-D-0001')
    })

    it('rejects empty string', () => {
      expect(() => contractNumber.parse('')).toThrow('required')
    })

    it('rejects string over 50 chars', () => {
      expect(() => contractNumber.parse('A'.repeat(51))).toThrow('too long')
    })
  })
})
