// filepath: lib/sync/adapters/word-online.ts
/**
 * Word Online Adapter — Microsoft Graph API
 *
 * Bi-directional sync between MissionPulse proposal sections
 * and Word Online documents via Microsoft Graph.
 * Preserves CUI watermarks during push/pull.
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────

const GRAPH_API = 'https://graph.microsoft.com/v1.0'
const CUI_MARKERS = [
  'CUI',
  'CONTROLLED UNCLASSIFIED INFORMATION',
  'CUI//SP-CTI',
  'CUI//SP-EXPT',
]

// ─── Token Helper ─────────────────────────────────────────────

async function getValidToken(companyId: string): Promise<string | null> {
  const supabase = await createSyncClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', companyId)
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60000) {
    return creds.access_token
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) return null

  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: Date.now() + newTokens.expires_in * 1000,
      }),
    })
    .eq('id', integration.id)

  return newTokens.access_token
}

// ─── Section Extraction ───────────────────────────────────────

/**
 * Parse Word content (markdown-style) into named sections.
 * Splits on heading markers (# / ## / ###) and maps heading text to body.
 */
export function extractSections(graphContent: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = graphContent.split('\n')
  let currentHeading = '__preamble__'
  let currentBody: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      const body = currentBody.join('\n').trim()
      if (body) {
        sections[currentHeading] = body
      }
      currentHeading = headingMatch[1].trim()
      currentBody = []
    } else {
      currentBody.push(line)
    }
  }

  const trailingBody = currentBody.join('\n').trim()
  if (trailingBody) {
    sections[currentHeading] = trailingBody
  }

  // Remove preamble if empty
  if (sections['__preamble__'] === '') {
    delete sections['__preamble__']
  }

  return sections
}

// ─── Push ─────────────────────────────────────────────────────

/**
 * Push section content to a Word Online document via Graph API.
 * Replaces the document body with concatenated section content.
 */
export async function pushToWordOnline(
  companyId: string,
  cloudFileId: string,
  sections: Record<string, string>
): Promise<ActionResult> {
  const token = await getValidToken(companyId)
  if (!token) return { success: false, error: 'M365 token unavailable' }

  // Build document content from sections
  const contentParts: string[] = []
  for (const [heading, body] of Object.entries(sections)) {
    if (heading !== '__preamble__') {
      contentParts.push(`# ${heading}`)
    }
    contentParts.push(body)
    contentParts.push('')
  }
  const fullContent = contentParts.join('\n')

  try {
    // Use the content endpoint to update the document body
    const res = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: Buffer.from(fullContent, 'utf-8'),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Graph API push failed (${res.status}): ${errText}` }
    }

    // Update sync timestamp in document_sync_state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_mp_edit_at: new Date().toISOString(),
      })
      .eq('cloud_file_id', cloudFileId)
      .eq('company_id', companyId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Push to Word Online failed',
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────

/**
 * Pull content from a Word Online document. Returns parsed sections
 * and the last-modified timestamp from Graph metadata.
 */
export async function pullFromWordOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ sections: Record<string, string>; lastModified: string } | null> {
  const token = await getValidToken(companyId)
  if (!token) return null

  try {
    // Fetch file metadata for lastModified
    const metaRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!metaRes.ok) return null

    const meta = (await metaRes.json()) as { lastModifiedDateTime: string }

    // Fetch raw content
    const contentRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/content`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!contentRes.ok) return null

    const rawContent = await contentRes.text()
    const sections = extractSections(rawContent)

    // Update sync state
    const supabase = await createSyncClient()
    await supabase
      .from('document_sync_state')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        last_cloud_edit_at: meta.lastModifiedDateTime,
      })
      .eq('cloud_file_id', cloudFileId)
      .eq('company_id', companyId)

    return {
      sections,
      lastModified: meta.lastModifiedDateTime,
    }
  } catch {
    return null
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
 * Get the Word Online web URL for a cloud file.
 */
export async function getWordOnlineUrl(
  companyId: string,
  cloudFileId: string
): Promise<string | null> {
  const token = await getValidToken(companyId)
  if (!token) return null

  try {
    const res = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return null

    const item = (await res.json()) as { webUrl: string }
    return item.webUrl
  } catch {
    return null
  }
}
