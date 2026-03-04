/**
 * XLSX Parser for Data Migration
 *
 * Parses Excel files using ExcelJS library (same library used for writing).
 * Converts spreadsheets to the same intermediate format as CSV parser.
 */
'use server'

import ExcelJS from 'exceljs'
import type { ParsedCSV, ParseError } from './csv-parser'

// ─── XLSX Parsing ────────────────────────────────────────────

/**
 * Parse XLSX buffer into headers and rows.
 * Uses ExcelJS for reading (same package used by xlsx-engine for writing).
 */
export async function parseXLSX(
  buffer: ArrayBuffer,
  sheetIndex = 0
): Promise<ParsedCSV & { sheetNames: string[] }> {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(new Uint8Array(buffer) as unknown as ArrayBuffer)

    const sheetNames = workbook.worksheets.map((ws) => ws.name)

    if (sheetNames.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: 'Workbook has no sheets' }],
        sheetNames: [],
      }
    }

    const worksheet = workbook.worksheets[sheetIndex] ?? workbook.worksheets[0]

    if (!worksheet) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: `Sheet at index ${sheetIndex} not found` }],
        sheetNames,
      }
    }

    // Extract headers from first row
    const headerRow = worksheet.getRow(1)
    const headers: string[] = []
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '')
    })

    if (headers.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: 'Sheet is empty' }],
        sheetNames,
      }
    }

    const errors: ParseError[] = []
    const rows: Record<string, string>[] = []

    // Iterate data rows (skip header row 1)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return // skip header

      const record: Record<string, string> = {}
      for (let col = 0; col < headers.length; col++) {
        const cell = row.getCell(col + 1)
        const value = cell.value

        if (value === undefined || value === null) {
          record[headers[col]] = ''
        } else if (value instanceof Date) {
          record[headers[col]] = value.toISOString().split('T')[0]
        } else if (typeof value === 'object' && 'result' in value) {
          // ExcelJS formula result
          record[headers[col]] = String(value.result ?? '')
        } else if (typeof value === 'object' && 'richText' in value) {
          // ExcelJS rich text
          const richText = value as { richText: Array<{ text: string }> }
          record[headers[col]] = richText.richText.map((t) => t.text).join('')
        } else {
          record[headers[col]] = String(value)
        }
      }

      // Validate row has at least one non-empty field
      const hasData = Object.values(record).some((v) => v.trim() !== '')
      if (!hasData) {
        errors.push({ row: rowNumber, column: '', message: 'Empty row' })
      } else {
        rows.push(record)
      }
    })

    if (rows.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        errors: [{ row: 0, column: '', message: 'Sheet is empty' }],
        sheetNames,
      }
    }

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
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(new Uint8Array(buffer) as unknown as ArrayBuffer)
    return workbook.worksheets.map((ws) => ws.name)
  } catch {
    return []
  }
}
