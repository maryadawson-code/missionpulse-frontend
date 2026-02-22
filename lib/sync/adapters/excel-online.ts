// filepath: lib/sync/adapters/excel-online.ts
/**
 * Excel Online Adapter — Microsoft Graph API
 *
 * Bi-directional sync for pricing/cost volumes stored in
 * Excel Online workbooks. Supports LCAT structure mapping
 * for government contract labor category pricing.
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { refreshM365Token } from '@/lib/integrations/m365/auth'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────

const GRAPH_API = 'https://graph.microsoft.com/v1.0'
const DEFAULT_WORKSHEET = 'Sheet1'

// ─── Types ────────────────────────────────────────────────────

interface GraphWorksheetRange {
  values: (string | number | boolean | null)[][]
  address: string
}

interface LCATRow {
  laborCategory: string
  rate: number
  hours: number
}

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

// ─── Cell Extraction ──────────────────────────────────────────

/**
 * Extract flat cell map from worksheet data.
 * Converts structured sheet response to { "A1": value, "B2": value } map.
 */
export function extractCells(
  sheetData: Record<string, unknown>
): Record<string, string | number> {
  const cells: Record<string, string | number> = {}
  const values = sheetData.values as (string | number | null)[][] | undefined
  const address = sheetData.address as string | undefined

  if (!values || !address) return cells

  // Parse starting cell from address (e.g. "Sheet1!A1:D10" → row 1, col A)
  const rangeMatch = address.match(/!([A-Z]+)(\d+)/)
  if (!rangeMatch) return cells

  const startCol = rangeMatch[1]
  const startRow = parseInt(rangeMatch[2], 10)
  const startColIndex = columnLetterToIndex(startCol)

  for (let rowOffset = 0; rowOffset < values.length; rowOffset++) {
    const row = values[rowOffset]
    for (let colOffset = 0; colOffset < row.length; colOffset++) {
      const val = row[colOffset]
      if (val === null || val === undefined || val === '') continue

      const colLetter = indexToColumnLetter(startColIndex + colOffset)
      const cellRef = `${colLetter}${startRow + rowOffset}`

      if (typeof val === 'number') {
        cells[cellRef] = val
      } else {
        cells[cellRef] = String(val)
      }
    }
  }

  return cells
}

// ─── Push ─────────────────────────────────────────────────────

/**
 * Push cell values to an Excel Online workbook via Graph API.
 * Groups cells by contiguous ranges for efficient batch updates.
 */
export async function pushToExcelOnline(
  companyId: string,
  cloudFileId: string,
  cells: Record<string, string | number>
): Promise<ActionResult> {
  const token = await getValidToken(companyId)
  if (!token) return { success: false, error: 'M365 token unavailable' }

  const cellEntries = Object.entries(cells)
  if (cellEntries.length === 0) return { success: true }

  try {
    // Update cells individually via PATCH to named ranges
    // Graph API supports batch cell updates through the range endpoint
    const batchRequests = cellEntries.map(([cellRef, value], index) => ({
      id: String(index),
      method: 'PATCH',
      url: `/me/drive/items/${cloudFileId}/workbook/worksheets('${DEFAULT_WORKSHEET}')/range(address='${cellRef}')`,
      headers: { 'Content-Type': 'application/json' },
      body: { values: [[value]] },
    }))

    // Process in batches of 20 (Graph API batch limit)
    const batchSize = 20
    for (let i = 0; i < batchRequests.length; i += batchSize) {
      const batch = batchRequests.slice(i, i + batchSize)

      const res = await fetch(`${GRAPH_API}/$batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: batch }),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) {
        const errText = await res.text()
        return { success: false, error: `Excel batch update failed (${res.status}): ${errText}` }
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
      .eq('cloud_file_id', cloudFileId)
      .eq('company_id', companyId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Push to Excel Online failed',
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────

/**
 * Pull cell data from an Excel Online workbook.
 * Returns flat cell map and the workbook last-modified timestamp.
 */
export async function pullFromExcelOnline(
  companyId: string,
  cloudFileId: string
): Promise<{ cells: Record<string, string | number>; lastModified: string } | null> {
  const token = await getValidToken(companyId)
  if (!token) return null

  try {
    // Fetch metadata for lastModified
    const metaRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as { lastModifiedDateTime: string }

    // Fetch used range from the default worksheet
    const rangeRes = await fetch(
      `${GRAPH_API}/me/drive/items/${cloudFileId}/workbook/worksheets('${DEFAULT_WORKSHEET}')/usedRange`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!rangeRes.ok) return null

    const rangeData = (await rangeRes.json()) as GraphWorksheetRange
    const cells = extractCells({
      values: rangeData.values,
      address: rangeData.address,
    })

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
      cells,
      lastModified: meta.lastModifiedDateTime,
    }
  } catch {
    return null
  }
}

// ─── LCAT Mapping ─────────────────────────────────────────────

/**
 * Map flat cell data to LCAT (Labor Category) pricing structure.
 * Expects column A = labor category name, B = rate, C = hours.
 * Skips header row (row 1) and empty/invalid rows.
 */
export function mapLCATStructure(
  cells: Record<string, string | number>
): LCATRow[] {
  const rows: LCATRow[] = []

  // Determine max row by scanning cell references
  let maxRow = 0
  for (const ref of Object.keys(cells)) {
    const rowMatch = ref.match(/\d+/)
    if (rowMatch) {
      const rowNum = parseInt(rowMatch[0], 10)
      if (rowNum > maxRow) maxRow = rowNum
    }
  }

  // Start from row 2 (skip header)
  for (let row = 2; row <= maxRow; row++) {
    const category = cells[`A${row}`]
    const rate = cells[`B${row}`]
    const hours = cells[`C${row}`]

    if (!category || typeof category !== 'string') continue

    const parsedRate = typeof rate === 'number' ? rate : parseFloat(String(rate ?? '0'))
    const parsedHours = typeof hours === 'number' ? hours : parseFloat(String(hours ?? '0'))

    if (isNaN(parsedRate) || isNaN(parsedHours)) continue

    rows.push({
      laborCategory: category.trim(),
      rate: parsedRate,
      hours: parsedHours,
    })
  }

  return rows
}

// ─── URL Helper ───────────────────────────────────────────────

/**
 * Get the Excel Online web URL for a cloud file.
 */
export async function getExcelOnlineUrl(
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

// ─── Column Helpers ───────────────────────────────────────────

function columnLetterToIndex(letters: string): number {
  let index = 0
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64)
  }
  return index
}

function indexToColumnLetter(index: number): string {
  let result = ''
  let remaining = index
  while (remaining > 0) {
    const mod = (remaining - 1) % 26
    result = String.fromCharCode(65 + mod) + result
    remaining = Math.floor((remaining - 1) / 26)
  }
  return result
}
