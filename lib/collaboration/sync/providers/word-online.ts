/**
 * Word Online Deep Integration — OneDrive/Graph API
 * Sprint 29 (T-29.2) — Phase J v1.3
 *
 * Section-level sync with Word Online documents via Microsoft Graph.
 * Uses the same token pattern as lib/integrations/m365/onedrive.ts.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import { contentHash } from '../hash'
import type { CloudDocumentSection } from '../types'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// ─── Token helper (mirrors onedrive.ts pattern) ─────────────

async function getAccessToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) throw new Error('No company')

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    throw new Error('M365 not connected')
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60_000) {
    return creds.access_token
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) throw new Error('Token refresh failed')

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

// ─── Public API ─────────────────────────────────────────────

/**
 * Fetch document sections (paragraphs grouped by heading) from a Word Online doc.
 */
export async function getDocumentSections(
  driveItemId: string
): Promise<CloudDocumentSection[]> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Graph API error: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const sections = parseWordSections(html)

  const result: CloudDocumentSection[] = []
  for (const section of sections) {
    const hash = await contentHash(section.content)
    result.push({ ...section, hash })
  }

  return result
}

/**
 * Push updated section content to a Word Online document.
 */
export async function pushSectionContent(
  driveItemId: string,
  _sectionId: string,
  content: string
): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/html',
      },
      body: content,
    }
  )

  return res.ok
}

/**
 * Pull latest content for a specific section from Word Online.
 */
export async function pullSectionContent(
  driveItemId: string,
  sectionId: string
): Promise<string | null> {
  const sections = await getDocumentSections(driveItemId)
  const match = sections.find(s => s.sectionId === sectionId)
  return match?.content ?? null
}

/**
 * Watch for changes via Graph metadata timestamp comparison.
 * Returns modified sections since lastSyncAt.
 */
export async function watchForChanges(
  driveItemId: string,
  lastSyncAt: string | null
): Promise<CloudDocumentSection[]> {
  const token = await getAccessToken()

  const metaRes = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}?$select=lastModifiedDateTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!metaRes.ok) return []

  const meta = await metaRes.json() as { lastModifiedDateTime?: string }
  const lastModified = meta.lastModifiedDateTime

  if (lastSyncAt && lastModified && new Date(lastModified) <= new Date(lastSyncAt)) {
    return []
  }

  return getDocumentSections(driveItemId)
}

/**
 * Get the Word Online edit URL for deep linking.
 */
export function getWordOnlineEditUrl(webUrl: string): string {
  return webUrl
}

// ─── Helpers ────────────────────────────────────────────────

interface ParsedSection {
  sectionId: string
  title: string
  content: string
}

function parseWordSections(html: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const headingPattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi
  const parts = html.split(headingPattern)

  for (let i = 1; i < parts.length; i += 2) {
    const title = stripHtml(parts[i] ?? '')
    const content = stripHtml(parts[i + 1] ?? '')
    if (title) {
      sections.push({
        sectionId: `section-${Math.floor(i / 2)}`,
        title,
        content,
      })
    }
  }

  if (sections.length === 0 && html.trim()) {
    sections.push({
      sectionId: 'section-0',
      title: 'Document',
      content: stripHtml(html),
    })
  }

  return sections
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
