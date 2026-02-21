/**
 * XLSX Parser for Data Migration
 *
 * Parses Excel files using SheetJS (xlsx) library.
 * Converts spreadsheets to the same intermediate format as CSV parser.
 */
'use server'

import type { ParsedCSV, ParseError } from './csv-parser'

// ─── XLSX Parsing ────────────────────────────────────────────

/**
 * Parse XLSX buffer into headers and rows.
 * Uses dynamic import of xlsx to keep bundle size down.
 */
export async function parseXLSX(
  buffer: ArrayBuffer,
  sheetIndex = 0
): Promise<ParsedCSV & { sheetNames: string[] }> {
  try {
    // Dynamic import — xlsx is only needed server-side during import
    const XLSX = await import('xlsx')

    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const sheetNames = workbook.SheetNames

    if (sheetNames.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: 'Workbook has no sheets' }],
        sheetNames: [],
      }
    }

    const sheetName = sheetNames[sheetIndex] ?? sheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: `Sheet "${sheetName}" not found` }],
        sheetNames,
      }
    }

    // Convert to JSON with header row
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false, // Return formatted strings
    })

    if (rawData.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: 'Sheet is empty' }],
        sheetNames,
      }
    }

    // Extract headers from first record's keys
    const headers = Object.keys(rawData[0])
    const errors: ParseError[] = []

    // Convert to string records
    const rows: Record<string, string>[] = rawData.map((rawRow, i) => {
      const row: Record<string, string> = {}
      for (const header of headers) {
        const value = rawRow[header]
        if (value === undefined || value === null) {
          row[header] = ''
        } else if (value instanceof Date) {
          row[header] = value.toISOString().split('T')[0]
        } else {
          row[header] = String(value)
        }
      }

      // Validate row has at least one non-empty field
      const hasData = Object.values(row).some((v) => v.trim() !== '')
      if (!hasData) {
        errors.push({ row: i + 2, column: '', message: 'Empty row' })
      }

      return row
    }).filter((row) => Object.values(row).some((v) => v.trim() !== ''))

    return { headers, rows, totalRows: rows.length, errors, sheetNames }
  } catch (err) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      errors: [{
        row: 0,
        column: '',
        message: err instanceof Error ? err.message : 'Failed to parse XLSX file',
      }],
      sheetNames: [],
    }
  }
}

/**
 * Get sheet names from an XLSX buffer without parsing all data.
 */
export async function getSheetNames(buffer: ArrayBuffer): Promise<string[]> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', bookSheets: true })
    return workbook.SheetNames
  } catch {
    return []
  }
}
