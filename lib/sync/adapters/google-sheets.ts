// filepath: lib/sync/adapters/google-sheets.ts
/**
 * Google Sheets Adapter — Google Sheets API
 *
 * Bi-directional sync for pricing/cost volumes stored in
 * Google Sheets. Supports LCAT structure mapping for
 * government contract labor category pricing.
 */
'use server'

import { createSyncClient } from '@/lib/supabase/sync-client'
import { refreshGoogleToken } from '@/lib/integrations/google/auth'
import type { ActionResult } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────

const SHEETS_API = 'https://sheets.googleapis.com/v4'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DEFAULT_SHEET = 'Sheet1'

// ─── Types ────────────────────────────────────────────────────

interface SheetsValueRange {
  range: string
  majorDimension: string
  values: (string | number)[][]
}

interface LCATRow {
  laborCategory: string
  rate: number
  hours: number
}

// ─── Cell Extraction ──────────────────────────────────────────

/**
 * Extract flat cell map from Sheets API response data.
 * Converts { range, values } to { "A1": value, "B2": value } format.
 */
export function extractCells(
  sheetData: Record<string, unknown>
): Record<string, string | number> {
  const cells: Record<string, string | number> = {}
  const values = sheetData.values as (string | number | null)[][] | undefined
  const range = sheetData.range as string | undefined

  if (!values || !range) return cells

  // Parse starting cell from range (e.g. "Sheet1!A1:D10" or "A1:D10")
  const rangeMatch = range.match(/!?([A-Z]+)(\d+)/)
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
        // Attempt numeric coercion for string numbers
        const numVal = Number(val)
        cells[cellRef] = !isNaN(numVal) && String(numVal) === String(val).trim()
          ? numVal
          : String(val)
      }
    }
  }

  return cells
}

// ─── Push ─────────────────────────────────────────────────────

/**
 * Push cell values to a Google Sheet via Sheets API.
 * Groups updates by row for efficient batch value updates.
 */
export async function pushToGoogleSheets(
  companyId: string,
  fileId: string,
  cells: Record<string, string | number>
): Promise<ActionResult> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { success: false, error: 'Google token unavailable' }

  const cellEntries = Object.entries(cells)
  if (cellEntries.length === 0) return { success: true }

  // Build value ranges for batch update
  const valueRanges = cellEntries.map(([cellRef, value]) => ({
    range: `${DEFAULT_SHEET}!${cellRef}`,
    majorDimension: 'ROWS',
    values: [[value]],
  }))

  try {
    const res = await fetch(
      `${SHEETS_API}/spreadsheets/${fileId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: valueRanges,
        }),
        signal: AbortSignal.timeout(20000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Sheets batchUpdate failed (${res.status}): ${errText}` }
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
      error: err instanceof Error ? err.message : 'Push to Google Sheets failed',
    }
  }
}

// ─── Pull ─────────────────────────────────────────────────────

/**
 * Pull cell data from a Google Sheet.
 * Returns flat cell map and the file last-modified timestamp.
 */
export async function pullFromGoogleSheets(
  companyId: string,
  fileId: string
): Promise<{ cells: Record<string, string | number>; lastModified: string } | null> {
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

    // Fetch all values from the default sheet
    const valuesRes = await fetch(
      `${SHEETS_API}/spreadsheets/${fileId}/values/${DEFAULT_SHEET}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!valuesRes.ok) return null

    const valueRange = (await valuesRes.json()) as SheetsValueRange
    const cells = extractCells({
      values: valueRange.values,
      range: valueRange.range,
    })

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
      cells,
      lastModified: meta.modifiedTime,
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
 * Get the Google Sheets web editor URL for a file.
 * This is a deterministic URL — no API call needed.
 */
export function getGoogleSheetsUrl(fileId: string): string {
  return `https://docs.google.com/spreadsheets/d/${fileId}/edit`
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
