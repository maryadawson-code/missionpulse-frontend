'use server'

import ExcelJS from 'exceljs'

export interface ExtractedSpreadsheet {
  text: string
  sheetCount: number
  info: {
    title?: string
    author?: string
  }
}

/**
 * Extract all text content from an XLSX file for RFP shredding.
 * Reads all cells from all sheets and concatenates them.
 */
export async function extractXlsxText(buffer: Buffer): Promise<ExtractedSpreadsheet> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(new Uint8Array(buffer) as unknown as ArrayBuffer)

  const paragraphs: string[] = []

  for (const worksheet of workbook.worksheets) {
    paragraphs.push(`--- ${worksheet.name} ---`)

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = []
      row.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value
        if (value === undefined || value === null) return

        if (value instanceof Date) {
          cells.push(value.toISOString().split('T')[0])
        } else if (typeof value === 'object' && 'richText' in value) {
          const richText = value as { richText: Array<{ text: string }> }
          cells.push(richText.richText.map((t) => t.text).join(''))
        } else if (typeof value === 'object' && 'result' in value) {
          cells.push(String(value.result ?? ''))
        } else {
          cells.push(String(value))
        }
      })
      if (cells.length > 0) {
        paragraphs.push(cells.join('\t'))
      }
    })
  }

  return {
    text: paragraphs.join('\n'),
    sheetCount: workbook.worksheets.length,
    info: {
      title: workbook.title || undefined,
      author: workbook.creator || undefined,
    },
  }
}
