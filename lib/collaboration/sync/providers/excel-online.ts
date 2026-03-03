/**
 * Excel Online Deep Integration — OneDrive/Graph API
 * Sprint 29 (T-29.3) — Phase J v1.3
 *
 * Cell-level sync for pricing worksheets via Microsoft Graph.
 * Focuses on CLIN tables, labor rates, and wrap rates.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import type { CellRange } from '../types'

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
 * Fetch worksheet data from an Excel Online workbook.
 */
export async function getWorksheetData(
  driveItemId: string,
  sheetName: string
): Promise<CellRange> {
  const token = await getAccessToken()
  const encodedSheet = encodeURIComponent(sheetName)

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/workbook/worksheets('${encodedSheet}')/usedRange`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Excel API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { address?: string; values?: unknown[][] }

  return {
    range: data.address ?? sheetName,
    values: data.values ?? [],
  }
}

/**
 * Push cell range updates to an Excel Online workbook.
 */
export async function pushCellRange(
  driveItemId: string,
  range: string,
  values: unknown[][]
): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/workbook/worksheets/range(address='${encodeURIComponent(range)}')`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  )

  return res.ok
}

/**
 * Pull latest cell range data from Excel Online.
 */
export async function pullCellRange(
  driveItemId: string,
  range: string
): Promise<CellRange> {
  const token = await getAccessToken()

  const res = await fetch(
    `${GRAPH_BASE}/me/drive/items/${driveItemId}/workbook/worksheets/range(address='${encodeURIComponent(range)}')`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Excel API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { address?: string; values?: unknown[][] }

  return {
    range: data.address ?? range,
    values: data.values ?? [],
  }
}

/**
 * Get the Excel Online edit URL for deep linking.
 */
export function getExcelOnlineEditUrl(webUrl: string): string {
  return webUrl
}

/**
 * Check if a workbook has been modified since last sync.
 */
export async function hasWorksheetChanges(
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
