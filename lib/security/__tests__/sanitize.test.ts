/**
 * Input Sanitization — Unit Tests
 *
 * Tests pure DOMPurify-based sanitization functions directly.
 * No mocking needed — these are deterministic transforms.
 */
import {
  sanitizeHtml,
  sanitizePlainText,
} from '../sanitize'

// ─── sanitizeHtml ───────────────────────────────────────────

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('returns plain text unchanged', () => {
    expect(sanitizeHtml('Hello, world!')).toBe('Hello, world!')
  })

  it('strips <script> tags', () => {
    const input = '<script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
  })

  it('preserves allowed formatting tags (p, strong, em)', () => {
    const input = '<p>This is <strong>bold</strong> and <em>italic</em>.</p>'
    expect(sanitizeHtml(input)).toBe(input)
  })

  it('strips event handler attributes like onerror', () => {
    const input = '<img src=x onerror=alert(1)>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
    // img is not in ALLOWED_TAGS for sanitizeHtml, so it should be stripped entirely
    expect(result).not.toContain('<img')
  })
})

// ─── sanitizePlainText ──────────────────────────────────────

describe('sanitizePlainText', () => {
  it('strips ALL HTML tags and returns text only', () => {
    const input = '<h1>Title</h1><p>Body <strong>bold</strong></p>'
    expect(sanitizePlainText(input)).toBe('TitleBody bold')
  })
})
