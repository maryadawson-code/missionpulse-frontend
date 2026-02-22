// filepath: lib/sync/adapters/google-docs.ts
/**
 * Google Docs Adapter — Google Docs & Drive APIs
 *
 * Bi-directional sync between MissionPulse proposal sections
 * and Google Docs. Supports push notifications for real-time
 * change detection and CUI watermark verification.
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { refreshGoogleToken } from '@/lib/integrations/google/auth'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────

const DOCS_API = 'https://docs.googleapis.com/v1'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

const CUI_MARKERS = [
  'CUI',
  'CONTROLLED UNCLASSIFIED INFORMATION',
  'CUI//SP-CTI',
  'CUI//SP-EXPT',
]

// ─── Types ────────────────────────────────────────────────────

interface GoogleDocsBody {
  content?: GoogleDocsElement[]
}

interface GoogleDocsElement {
  paragraph?: {
    paragraphStyle?: { namedStyleType?: string }
    elements?: { textRun?: { content?: string } }[]
  }
  sectionBreak?: Record<string, unknown>
}

interface GoogleDocsDocument {
  documentId: string
  title: string
  body: GoogleDocsBody
  revisionId: string
}

// ─── Section Extraction ───────────────────────────────────────

/**
 * Parse Google Docs content (plain text with heading markers) into named sections.
 * Splits on lines that appear to be headings (all caps or prefixed with heading markers).
 */
export function extractSections(docContent: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = docContent.split('\n')
  let currentHeading = '__preamble__'
  let currentBody: string[] = []

  for (const line of lines) {
    // Detect headings: markdown-style or Google Docs-style (UPPERCASE lines)
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
    const isAllCapsHeading =
      line.trim().length > 0 &&
      line.trim().length < 120 &&
      line.trim() === line.trim().toUpperCase() &&
      /[A-Z]/.test(line)

    if (headingMatch) {
      const body = currentBody.join('\n').trim()
      if (body) sections[currentHeading] = body
      currentHeading = headingMatch[1].trim()
      currentBody = []
    } else if (isAllCapsHeading && currentBody.length > 0) {
      const body = currentBody.join('\n').trim()
      if (body) sections[currentHeading] = body
      currentHeading = line.trim()
      currentBody = []
    } else {
      currentBody.push(line)
    }
  }

  const trailingBody = currentBody.join('\n').trim()
  if (trailingBody) {
    sections[currentHeading] = trailingBody
  }

  if (sections['__preamble__'] === '') {
    delete sections['__preamble__']
  }

  return sections
}

// ─── Push ─────────────────────────────────────────────────────

/**
 * Push section content to a Google Doc via batchUpdate API.
 * Clears existing body and inserts sections with heading styles.
 */
export async function pushToGoogleDocs(
  companyId: string,
  fileId: string,
  sections: Record<string, string>
): Promise<ActionResult> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { success: false, error: 'Google token unavailable' }

  // Build the document text from sections
  const insertParts: string[] = []
  for (const [heading, body] of Object.entries(sections)) {
    if (heading !== '__preamble__') {
      insertParts.push(heading)
    }
    insertParts.push(body)
    insertParts.push('')
  }
  const fullText = insertParts.join('\n')

  try {
    // First, get the current document to determine end index for clearing
    const docRes = await fetch(`${DOCS_API}/documents/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!docRes.ok) {
      const errText = await docRes.text()
      return { success: false, error: `Failed to read doc (${docRes.status}): ${errText}` }
    }

    const doc = (await docRes.json()) as GoogleDocsDocument
    const bodyContent = doc.body.content ?? []

    // Calculate the document end index
    let endIndex = 1
    for (const element of bodyContent) {
      if (element.paragraph?.elements) {
        for (const el of element.paragraph.elements) {
          const text = el.textRun?.content ?? ''
          endIndex += text.length
        }
      }
    }

    // Build batch update requests: delete all, then insert new content
    const requests: Record<string, unknown>[] = []

    if (endIndex > 2) {
      requests.push({
        deleteContentRange: {
          range: { startIndex: 1, endIndex: endIndex - 1 },
        },
      })
    }

    if (fullText.trim()) {
      requests.push({
        insertText: {
          location: { index: 1 },
          text: fullText,
        },
      })
    }

    if (requests.length > 0) {
      const batchRes = await fetch(
        `${DOCS_API}/documents/${fileId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
          signal: AbortSignal.timeout(15000),
        }
      )

      if (!batchRes.ok) {
        const errText = await batchRes.text()
        return { success: false, error: `Docs batchUpdate failed (${batchRes.status}): ${errText}` }
      }
    }

    // Update sync state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_mp_edit_at: new Date().toISOString(),
      })
      .eq('cloud_file_id', fileId)
      .eq('company_id', companyId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Push to Google Docs failed',
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────

/**
 * Pull content from a Google Doc. Returns parsed sections
 * and the file last-modified timestamp from Drive metadata.
 */
export async function pullFromGoogleDocs(
  companyId: string,
  fileId: string
): Promise<{ sections: Record<string, string>; lastModified: string } | null> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return null

  try {
    // Fetch Drive metadata for lastModified
    const metaRes = await fetch(
      `${DRIVE_API}/files/${fileId}?fields=modifiedTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as { modifiedTime: string }

    // Fetch document content
    const docRes = await fetch(`${DOCS_API}/documents/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    })

    if (!docRes.ok) return null

    const doc = (await docRes.json()) as GoogleDocsDocument

    // Extract plain text from document body
    const textParts: string[] = []
    const bodyContent = doc.body.content ?? []

    for (const element of bodyContent) {
      if (element.paragraph?.elements) {
        const paragraphText = element.paragraph.elements
          .map((el) => el.textRun?.content ?? '')
          .join('')

        // Detect heading style
        const style = element.paragraph.paragraphStyle?.namedStyleType
        if (style && style.startsWith('HEADING')) {
          textParts.push(`# ${paragraphText.trim()}`)
        } else {
          textParts.push(paragraphText)
        }
      }
    }

    const fullText = textParts.join('\n')
    const sections = extractSections(fullText)

    // Update sync state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_cloud_edit_at: meta.modifiedTime,
      })
      .eq('cloud_file_id', fileId)
      .eq('company_id', companyId)

    return {
      sections,
      lastModified: meta.modifiedTime,
    }
  } catch {
    return null
  }
}

// ─── Push Notifications ───────────────────────────────────────

/**
 * Register a Drive push notification channel for a file.
 * Google will POST to the webhook URL when the file changes.
 * Channel expires after 24 hours and must be re-registered.
 */
export async function registerPushNotification(
  companyId: string,
  fileId: string,
  webhookUrl: string
): Promise<ActionResult> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { success: false, error: 'Google token unavailable' }

  const channelId = `mp-sync-${companyId}-${fileId}-${Date.now()}`
  const expiration = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  try {
    const res = await fetch(`${DRIVE_API}/files/${fileId}/watch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration,
        payload: true,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Watch registration failed (${res.status}): ${errText}` }
    }

    const channel = (await res.json()) as { id: string; resourceId: string; expiration: string }

    // Store channel info for cleanup/renewal
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        metadata: {
          watch_channel_id: channel.id,
          watch_resource_id: channel.resourceId,
          watch_expiration: channel.expiration,
        },
      })
      .eq('cloud_file_id', fileId)
      .eq('company_id', companyId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Push notification registration failed',
    }
  }
}

// ─── CUI Verification ────────────────────────────────────────

/**
 * Verify that CUI watermark/banner markings are preserved in content.
 * Checks for standard CUI marking patterns per NIST SP 800-171.
 */
export function verifyCUIWatermark(content: string): boolean {
  if (!content || content.trim().length === 0) return false

  const upperContent = content.toUpperCase()
  return CUI_MARKERS.some((marker) => upperContent.includes(marker))
}

// ─── URL Helper ───────────────────────────────────────────────

/**
 * Get the Google Docs web editor URL for a file.
 * This is a deterministic URL — no API call needed.
 */
export function getGoogleDocsUrl(fileId: string): string {
  return `https://docs.google.com/document/d/${fileId}/edit`
}
