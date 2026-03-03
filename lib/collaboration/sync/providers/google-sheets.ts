/**
 * Google Sheets Deep Integration — Google Workspace API
 * Sprint 29 (T-29.5) — Phase J v1.3
 *
 * Cell-level sync for pricing worksheets via Google Sheets API.
 * Uses refreshGoogleToken() from lib/integrations/google/auth.ts.
 *
 * © 2026 Mission Meets Tech
 */

import { refreshGoogleToken } from '@/lib/integrations/google/auth'
import type { CellRange } from '../types'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

// ─── Public API ─────────────────────────────────────────────

/**
 * Fetch sheet data from a Google Sheets spreadsheet.
 */
export async function getSheetData(
  companyId: string,
  spreadsheetId: string,
  sheetName: string
): Promise<CellRange> {
  const token = await refreshGoogleToken(companyId)
  if (!token) throw new Error('Google Workspace not connected')

  const range = encodeURIComponent(sheetName)

  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { range?: string; values?: unknown[][] }

  return {
    range: data.range ?? sheetName,
    values: data.values ?? [],
  }
}

/**
 * Push cell range updates to a Google Sheets spreadsheet.
 */
export async function pushCellRange(
  companyId: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][]
): Promise<boolean> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return false

  const encodedRange = encodeURIComponent(range)

  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
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
 * Pull latest cell range data from Google Sheets.
 */
export async function pullCellRange(
  companyId: string,
  spreadsheetId: string,
  range: string
): Promise<CellRange> {
  const token = await refreshGoogleToken(companyId)
  if (!token) throw new Error('Google Workspace not connected')

  const encodedRange = encodeURIComponent(range)

  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodedRange}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { range?: string; values?: unknown[][] }

  return {
    range: data.range ?? range,
    values: data.values ?? [],
  }
}

/**
 * Check if spreadsheet has been modified since last sync.
 */
export async function hasSheetChanges(
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
 * Get the Google Sheets edit URL for deep linking.
 */
export function getGoogleSheetsEditUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
}
