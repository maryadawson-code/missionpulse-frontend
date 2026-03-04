/**
 * Content Hash Utility — SHA-256
 * Sprint 29 (T-29.1) — Phase J v1.3
 * © 2026 Mission Meets Tech
 */

/**
 * Compute SHA-256 hash of content for change detection.
 * Uses Web Crypto API (available in Node 18+ and all modern browsers).
 */
export async function contentHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compare two hashes to detect changes.
 */
export function hashesMatch(a: string, b: string): boolean {
  return a === b
}
