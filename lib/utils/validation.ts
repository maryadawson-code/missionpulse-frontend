import { z } from 'zod'

/** Non-empty trimmed string */
export const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`)

/** Optional string that trims to empty → undefined */
export const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional()

/** Email address */
export const emailSchema = z.string().trim().email('Invalid email address')

/** URL (optional — empty string OK) */
export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url('Invalid URL').optional())
  .optional()

/** Dollar amount (non-negative) */
export const dollarAmount = z.coerce
  .number()
  .min(0, 'Must be a positive amount')

/** Percentage 0–100 */
export const percentage = z.coerce
  .number()
  .min(0, 'Must be 0 or greater')
  .max(100, 'Must be 100 or less')

/** Future date (for deadlines) */
export const futureDate = z.coerce.date().refine((d) => d > new Date(), {
  message: 'Date must be in the future',
})

/** Date string (YYYY-MM-DD format, optional) */
export const optionalDateString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
      .optional()
  )
  .optional()

/** NAICS code (6 digits) */
export const naicsCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'NAICS code must be 6 digits')

/** Contract number pattern */
export const contractNumber = z
  .string()
  .trim()
  .min(1, 'Contract number is required')
  .max(50, 'Contract number too long')
