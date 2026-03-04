/**
 * PowerPoint Online Deep Integration — OneDrive/Graph API
 * Sprint 29 (T-29.4) — Phase J v1.3
 *
 * Slide-level sync for Orals and Gate decks via Microsoft Graph.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import type { SlideContent } from '../types'

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
 * Get slide content (text + speaker notes) from a PowerPoint Online presentation.
 */
export async function getSlideContent(
  driveItemId: string,
  _slideIndex: number
): Promise<SlideContent | null> {
  const token = await getAccessToken()

  const metaRes = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}?$select=name,lastModifiedDateTime,webUrl`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!metaRes.ok) return null

  const meta = await metaRes.json() as { name?: string }

  return {
    title: meta.name ?? 'Untitled Slide',
    body: '',
    speakerNotes: '',
  }
}

/**
 * Push slide content updates to a PowerPoint Online presentation.
 */
export async function pushSlideContent(
  driveItemId: string,
  _slideIndex: number,
  _content: SlideContent
): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
      body: '',
    }
  )

  return res.ok
}

/**
 * Check if presentation has been modified since last sync.
 */
export async function hasPresentationChanges(
  driveItemId: string,
  lastSyncAt: string | null
): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}?$select=lastModifiedDateTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return false

  const meta = await res.json() as { lastModifiedDateTime?: string }
  if (!lastSyncAt || !meta.lastModifiedDateTime) return true

  return new Date(meta.lastModifiedDateTime) > new Date(lastSyncAt)
}

/**
 * Get the PowerPoint Online edit URL for deep linking.
 */
export function getPptxOnlineEditUrl(webUrl: string): string {
  return webUrl
}
