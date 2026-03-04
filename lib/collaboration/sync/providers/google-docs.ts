/**
 * Google Docs Deep Integration — Google Workspace API
 * Sprint 29 (T-29.5) — Phase J v1.3
 *
 * Section-level sync with Google Docs via Google Docs API.
 * Uses refreshGoogleToken() from lib/integrations/google/auth.ts
 * which returns an access token directly (same pattern as drive.ts).
 *
 * © 2026 Mission Meets Tech
 */

import { refreshGoogleToken } from '@/lib/integrations/google/auth'
import { contentHash } from '../hash'
import type { CloudDocumentSection } from '../types'

const DOCS_API = 'https://docs.googleapis.com/v1'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

// ─── Public API ─────────────────────────────────────────────

/**
 * Fetch document sections from a Google Doc.
 * Maps Google Docs headings to MissionPulse sections.
 */
export async function getDocumentSections(
  companyId: string,
  documentId: string
): Promise<CloudDocumentSection[]> {
  const token = await refreshGoogleToken(companyId)
  if (!token) throw new Error('Google Workspace not connected')

  const res = await fetch(
    `${DOCS_API}/documents/${documentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Google Docs API error: ${res.status} ${res.statusText}`)
  }

  const doc = await res.json() as GoogleDocResponse

  const sections = parseGoogleDocSections(doc)
  const result: CloudDocumentSection[] = []

  for (const section of sections) {
    const hash = await contentHash(section.content)
    result.push({ ...section, hash })
  }

  return result
}

/**
 * Push section content to a Google Doc via batchUpdate.
 */
export async function pushSectionContent(
  companyId: string,
  documentId: string,
  _sectionId: string,
  content: string
): Promise<boolean> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return false

  const res = await fetch(
    `${DOCS_API}/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    }
  )

  return res.ok
}

/**
 * Pull latest content for a specific section from Google Doc.
 */
export async function pullSectionContent(
  companyId: string,
  documentId: string,
  sectionId: string
): Promise<string | null> {
  const sections = await getDocumentSections(companyId, documentId)
  const match = sections.find(s => s.sectionId === sectionId)
  return match?.content ?? null
}

/**
 * Check if document has been modified since last sync.
 */
export async function hasDocumentChanges(
  companyId: string,
  fileId: string,
  lastSyncAt: string | null
): Promise<boolean> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return false

  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?fields=modifiedTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return false

  const meta = await res.json() as { modifiedTime?: string }
  if (!lastSyncAt || !meta.modifiedTime) return true

  return new Date(meta.modifiedTime) > new Date(lastSyncAt)
}

/**
 * Get the Google Docs edit URL for deep linking.
 */
export function getGoogleDocsEditUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/edit`
}

// ─── Helpers ────────────────────────────────────────────────

interface GoogleDocResponse {
  documentId: string
  title: string
  body?: {
    content?: GoogleDocElement[]
  }
}

interface GoogleDocElement {
  paragraph?: {
    paragraphStyle?: { namedStyleType?: string }
    elements?: Array<{
      textRun?: { content?: string }
    }>
  }
}

function parseGoogleDocSections(doc: GoogleDocResponse): Omit<CloudDocumentSection, 'hash'>[] {
  const sections: Omit<CloudDocumentSection, 'hash'>[] = []
  const elements = doc.body?.content ?? []

  let currentTitle = ''
  let currentContent = ''
  let sectionIndex = 0

  for (const element of elements) {
    const para = element.paragraph
    if (!para) continue

    const style = para.paragraphStyle?.namedStyleType ?? ''
    const text = (para.elements ?? [])
      .map(e => e.textRun?.content ?? '')
      .join('')

    if (style.startsWith('HEADING')) {
      if (currentTitle || currentContent.trim()) {
        sections.push({
          sectionId: `section-${sectionIndex}`,
          title: currentTitle || `Section ${sectionIndex + 1}`,
          content: currentContent.trim(),
        })
        sectionIndex++
      }
      currentTitle = text.trim()
      currentContent = ''
    } else {
      currentContent += text
    }
  }

  if (currentTitle || currentContent.trim()) {
    sections.push({
      sectionId: `section-${sectionIndex}`,
      title: currentTitle || doc.title,
      content: currentContent.trim(),
    })
  }

  return sections
}
