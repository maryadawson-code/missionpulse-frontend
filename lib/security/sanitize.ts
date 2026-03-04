/**
 * Input Sanitization Utilities
 *
 * Prevents stored XSS by sanitizing user-generated content at write boundaries.
 * Uses DOMPurify (isomorphic — works in both server and client environments).
 *
 * Three levels:
 *   sanitizeHtml()      — strips scripts/handlers, keeps safe formatting tags
 *   sanitizeMarkdown()  — sanitize after markdown rendering
 *   sanitizePlainText() — strips ALL HTML tags entirely
 */
import DOMPurify from 'isomorphic-dompurify'

// Allowed HTML tags for proposal/comment content (safe formatting)
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code',
  'a', 'span', 'div',
  'sup', 'sub', 'hr',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id',
  'colspan', 'rowspan', 'scope',
]

/**
 * Sanitize HTML content — strips scripts, event handlers, dangerous
 * attributes while preserving safe formatting tags.
 * Use for: proposal sections, comments, activity descriptions.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize markdown-rendered HTML — same as sanitizeHtml but includes
 * img tags for embedded images in markdown content.
 * Use for: rendered markdown in playbook entries, notes.
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...ALLOWED_TAGS, 'img'],
    ALLOWED_ATTR: [...ALLOWED_ATTR, 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Strip ALL HTML tags — returns plain text only.
 * Use for: fields that should never contain HTML (titles, names, etc).
 */
export function sanitizePlainText(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
