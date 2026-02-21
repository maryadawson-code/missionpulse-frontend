/**
 * XLSX Generation Engine — server-side Excel workbook generation.
 *
 * Three outputs:
 * 1. Compliance Matrix (from Iron Dome)
 * 2. Cost Model (from Pricing module)
 * 3. Red Team Scorecard (from Black Hat)
 *
 * Features: formatted headers, conditional formatting (green/yellow/red),
 * freeze panes, CUI banners on sensitive exports.
 */

import ExcelJS from 'exceljs'

// ─── Brand Constants ─────────────────────────────────────────

const BRAND = {
  cyan: { argb: 'FF00E5FA' },
  navy: { argb: 'FF00050F' },
  navySurface: { argb: 'FF0F172A' },
  white: { argb: 'FFFFFFFF' },
  green: { argb: 'FF10B981' },
  yellow: { argb: 'FFF59E0B' },
  red: { argb: 'FFEF4444' },
  gray: { argb: 'FF94A3B8' },
  headerFill: { argb: 'FF1E293B' },
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Inter',
  bold: true,
  color: BRAND.cyan,
  size: 11,
}

const BODY_FONT: Partial<ExcelJS.Font> = {
  name: 'Inter',
  color: BRAND.white,
  size: 10,
}

// ─── Types ───────────────────────────────────────────────────

export interface ComplianceRow {
  reference: string
  requirement_text: string
  section: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: string
  assigned_to?: string
  evidence?: string
  eval_factor?: string
}

export interface CostModelCLIN {
  clin_number: string
  description: string
  labor_categories: Array<{
    lcat: string
    quantity: number
    rate: number
    wrap_rate?: number
  }>
}

export interface RedTeamCriterion {
  criteria: string
  score: number
  max_score: number
  weaknesses: string
  recommended_fix: string
}

// ─── Helpers ─────────────────────────────────────────────────

function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = HEADER_FONT
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: BRAND.headerFill,
    }
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: BRAND.cyan },
    }
  })
  row.height = 28
}

function statusFill(
  status: string
): ExcelJS.FillPattern {
  const lower = status.toLowerCase()
  let color = BRAND.gray
  if (
    lower === 'verified' ||
    lower === 'addressed' ||
    lower === 'compliant' ||
    lower === 'complete'
  ) {
    color = BRAND.green
  } else if (
    lower === 'in_progress' ||
    lower === 'in progress' ||
    lower === 'partial' ||
    lower === 'review_needed'
  ) {
    color = BRAND.yellow
  } else if (
    lower === 'not_started' ||
    lower === 'not started' ||
    lower === 'non_compliant' ||
    lower === 'missing'
  ) {
    color = BRAND.red
  }
  return { type: 'pattern', pattern: 'solid', fgColor: color }
}

function priorityFill(
  priority: string
): ExcelJS.FillPattern {
  const lower = priority.toLowerCase()
  if (lower === 'critical') return { type: 'pattern', pattern: 'solid', fgColor: BRAND.red }
  if (lower === 'high') return { type: 'pattern', pattern: 'solid', fgColor: BRAND.yellow }
  return { type: 'pattern', pattern: 'solid', fgColor: BRAND.gray }
}

function addCUIBanner(worksheet: ExcelJS.Worksheet, label: string): void {
  worksheet.insertRow(1, [label])
  const bannerRow = worksheet.getRow(1)
  bannerRow.getCell(1).font = {
    name: 'Inter',
    bold: true,
    color: BRAND.red,
    size: 12,
  }
  bannerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A0000' },
  }
  bannerRow.height = 30
  worksheet.mergeCells(1, 1, 1, 8)
  bannerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
}

// ─── Compliance Matrix ───────────────────────────────────────

export async function generateComplianceMatrix(
  rows: ComplianceRow[],
  opportunityTitle: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MissionPulse'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Compliance Matrix', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  // Title row
  ws.addRow([`Compliance Matrix — ${opportunityTitle}`])
  ws.getRow(1).font = { name: 'Inter', bold: true, size: 14, color: BRAND.cyan }
  ws.mergeCells(1, 1, 1, 8)
  ws.getRow(1).height = 32

  // Headers
  ws.addRow([
    'Reference',
    'Requirement',
    'Section',
    'Priority',
    'Status',
    'Assigned To',
    'Evidence',
    'Eval Factor',
  ])
  applyHeaderStyle(ws.getRow(2))

  // Column widths
  ws.getColumn(1).width = 12
  ws.getColumn(2).width = 55
  ws.getColumn(3).width = 15
  ws.getColumn(4).width = 12
  ws.getColumn(5).width = 14
  ws.getColumn(6).width = 18
  ws.getColumn(7).width = 25
  ws.getColumn(8).width = 18

  // Data rows
  for (const row of rows) {
    const r = ws.addRow([
      row.reference,
      row.requirement_text,
      row.section,
      row.priority,
      row.status,
      row.assigned_to ?? '',
      row.evidence ?? '',
      row.eval_factor ?? '',
    ])

    r.eachCell((cell) => {
      cell.font = BODY_FONT
      cell.alignment = { vertical: 'top', wrapText: true }
    })

    // Conditional formatting
    r.getCell(4).fill = priorityFill(row.priority)
    r.getCell(5).fill = statusFill(row.status)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ─── Cost Model ──────────────────────────────────────────────

export async function generateCostModel(
  clins: CostModelCLIN[],
  opportunityTitle: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MissionPulse'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Cost Model', {
    views: [{ state: 'frozen', ySplit: 3 }],
  })

  // CUI Banner
  addCUIBanner(ws, 'CUI//SP-PROPIN — PRICING DATA — CONTROLLED UNCLASSIFIED INFORMATION')

  // Title
  ws.addRow([`Cost Model — ${opportunityTitle}`])
  ws.getRow(2).font = { name: 'Inter', bold: true, size: 14, color: BRAND.cyan }
  ws.mergeCells(2, 1, 2, 6)

  // Headers
  ws.addRow(['CLIN', 'LCAT', 'Quantity', 'Rate', 'Wrap Rate', 'Extended'])
  applyHeaderStyle(ws.getRow(3))

  ws.getColumn(1).width = 14
  ws.getColumn(2).width = 30
  ws.getColumn(3).width = 12
  ws.getColumn(4).width = 14
  ws.getColumn(5).width = 14
  ws.getColumn(6).width = 18

  let grandTotal = 0

  for (const clin of clins) {
    // CLIN header row
    const clinRow = ws.addRow([clin.clin_number, clin.description])
    clinRow.font = { name: 'Inter', bold: true, color: BRAND.cyan, size: 11 }
    ws.mergeCells(clinRow.number, 2, clinRow.number, 6)

    let clinTotal = 0

    for (const lcat of clin.labor_categories) {
      const extended = lcat.quantity * lcat.rate * (lcat.wrap_rate ?? 1)
      clinTotal += extended
      const r = ws.addRow([
        '',
        lcat.lcat,
        lcat.quantity,
        lcat.rate,
        lcat.wrap_rate ?? 1,
        extended,
      ])
      r.eachCell((cell) => {
        cell.font = BODY_FONT
        cell.alignment = { vertical: 'middle' }
      })
      r.getCell(4).numFmt = '$#,##0.00'
      r.getCell(5).numFmt = '0.00x'
      r.getCell(6).numFmt = '$#,##0.00'
    }

    // CLIN subtotal
    const subRow = ws.addRow(['', 'CLIN Subtotal', '', '', '', clinTotal])
    subRow.font = { name: 'Inter', bold: true, color: BRAND.yellow, size: 10 }
    subRow.getCell(6).numFmt = '$#,##0.00'

    grandTotal += clinTotal
  }

  // Grand total
  ws.addRow([])
  const totalRow = ws.addRow(['', 'GRAND TOTAL', '', '', '', grandTotal])
  totalRow.font = { name: 'Inter', bold: true, color: BRAND.cyan, size: 12 }
  totalRow.getCell(6).numFmt = '$#,##0.00'
  totalRow.getCell(6).border = {
    top: { style: 'double', color: BRAND.cyan },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ─── Red Team Scorecard ──────────────────────────────────────

export async function generateRedTeamScorecard(
  criteria: RedTeamCriterion[],
  opportunityTitle: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MissionPulse'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Red Team Scorecard', {
    views: [{ state: 'frozen', ySplit: 3 }],
  })

  // CUI Banner
  addCUIBanner(ws, 'CUI//OPSEC — RED TEAM ANALYSIS — CONTROLLED UNCLASSIFIED INFORMATION')

  // Title
  ws.addRow([`Red Team Scorecard — ${opportunityTitle}`])
  ws.getRow(2).font = { name: 'Inter', bold: true, size: 14, color: BRAND.cyan }
  ws.mergeCells(2, 1, 2, 5)

  // Headers
  ws.addRow(['Criteria', 'Score', 'Weaknesses', 'Recommended Fix', 'Status'])
  applyHeaderStyle(ws.getRow(3))

  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 14
  ws.getColumn(3).width = 35
  ws.getColumn(4).width = 35
  ws.getColumn(5).width = 14

  let totalScore = 0
  let totalMax = 0

  for (const item of criteria) {
    const pct = item.max_score > 0 ? item.score / item.max_score : 0
    const status = pct >= 0.8 ? 'Strong' : pct >= 0.5 ? 'Adequate' : 'Weak'

    const r = ws.addRow([
      item.criteria,
      `${item.score}/${item.max_score}`,
      item.weaknesses,
      item.recommended_fix,
      status,
    ])

    r.eachCell((cell) => {
      cell.font = BODY_FONT
      cell.alignment = { vertical: 'top', wrapText: true }
    })

    // Score color
    r.getCell(2).fill = statusFill(
      pct >= 0.8 ? 'verified' : pct >= 0.5 ? 'in_progress' : 'not_started'
    )
    r.getCell(5).fill = statusFill(
      pct >= 0.8 ? 'verified' : pct >= 0.5 ? 'in_progress' : 'not_started'
    )

    totalScore += item.score
    totalMax += item.max_score
  }

  // Summary
  ws.addRow([])
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const summaryRow = ws.addRow([
    'OVERALL SCORE',
    `${totalScore}/${totalMax} (${overallPct}%)`,
  ])
  summaryRow.font = { name: 'Inter', bold: true, color: BRAND.cyan, size: 12 }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
