import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock ExcelJS ───────────────────────────────────────────

const mockGetCell = vi.fn().mockReturnValue({
  font: {},
  fill: {},
  alignment: {},
  border: {},
  numFmt: '',
})

const mockEachCell = vi.fn().mockImplementation((cb: (cell: any) => void) => {
  cb({ font: {}, fill: {}, alignment: {}, border: {}, numFmt: '' })
})

const mockGetRow = vi.fn().mockReturnValue({
  font: {},
  height: 0,
  getCell: mockGetCell,
  eachCell: mockEachCell,
  number: 1,
})

const mockAddRow = vi.fn().mockReturnValue({
  font: {},
  height: 0,
  getCell: mockGetCell,
  eachCell: mockEachCell,
  number: 1,
})

const mockInsertRow = vi.fn()

const mockMergeCells = vi.fn()

const mockGetColumn = vi.fn().mockReturnValue({ width: 0 })

const mockWorksheet = {
  addRow: mockAddRow,
  insertRow: mockInsertRow,
  getRow: mockGetRow,
  getColumn: mockGetColumn,
  mergeCells: mockMergeCells,
}

const mockWriteBuffer = vi.fn().mockResolvedValue(Buffer.from('test-xlsx'))

const mockAddWorksheet = vi.fn().mockReturnValue(mockWorksheet)

vi.mock('exceljs', () => {
  class MockWorkbook {
    creator = ''
    created = new Date()
    xlsx = { writeBuffer: mockWriteBuffer }
    addWorksheet = mockAddWorksheet
  }
  return {
    default: { Workbook: MockWorkbook },
  }
})

import {
  generateComplianceMatrix,
  generateCostModel,
  generateRedTeamScorecard,
} from '@/lib/docgen/xlsx-engine'
import type { ComplianceRow, CostModelCLIN, RedTeamCriterion } from '@/lib/docgen/xlsx-engine'

// ─── Tests ──────────────────────────────────────────────────

describe('xlsx-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock return values
    mockGetRow.mockReturnValue({
      font: {},
      height: 0,
      getCell: mockGetCell,
      eachCell: mockEachCell,
      number: 1,
    })
    mockAddRow.mockReturnValue({
      font: {},
      height: 0,
      getCell: mockGetCell,
      eachCell: mockEachCell,
      number: 1,
    })
  })

  describe('generateComplianceMatrix', () => {
    it('should generate a buffer', async () => {
      const rows: ComplianceRow[] = [
        {
          reference: 'L.1',
          requirement_text: 'Must comply with NIST 800-53',
          section: 'Security',
          priority: 'critical',
          status: 'verified',
          assigned_to: 'John',
          evidence: 'SSP document',
          eval_factor: 'Technical',
        },
      ]

      const result = await generateComplianceMatrix(rows, 'Test Opportunity')
      expect(result).toBeInstanceOf(Buffer)
      expect(mockAddWorksheet).toHaveBeenCalledWith('Compliance Matrix', expect.any(Object))
    })

    it('should handle empty rows', async () => {
      const result = await generateComplianceMatrix([], 'Empty Test')
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should apply conditional formatting for different statuses', async () => {
      const rows: ComplianceRow[] = [
        { reference: 'L.1', requirement_text: 'Req 1', section: 'S1', priority: 'critical', status: 'verified' },
        { reference: 'L.2', requirement_text: 'Req 2', section: 'S2', priority: 'high', status: 'in_progress' },
        { reference: 'L.3', requirement_text: 'Req 3', section: 'S3', priority: 'medium', status: 'not_started' },
        { reference: 'L.4', requirement_text: 'Req 4', section: 'S4', priority: 'low', status: 'other' },
      ]

      const result = await generateComplianceMatrix(rows, 'Test')
      expect(result).toBeInstanceOf(Buffer)
      // addRow called: 1 title + 1 header + 4 data = 6
      expect(mockAddRow).toHaveBeenCalledTimes(6)
    })
  })

  describe('generateCostModel', () => {
    it('should generate a buffer with CLIN data', async () => {
      const clins: CostModelCLIN[] = [
        {
          clin_number: 'CLIN 001',
          description: 'Base Year',
          labor_categories: [
            { lcat: 'Senior Developer', quantity: 2, rate: 150, wrap_rate: 1.5 },
            { lcat: 'Project Manager', quantity: 1, rate: 175 },
          ],
        },
      ]

      const result = await generateCostModel(clins, 'Cost Test')
      expect(result).toBeInstanceOf(Buffer)
      expect(mockAddWorksheet).toHaveBeenCalledWith('Cost Model', expect.any(Object))
    })

    it('should handle empty CLINs', async () => {
      const result = await generateCostModel([], 'Empty Cost')
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should handle wrap_rate defaulting to 1', async () => {
      const clins: CostModelCLIN[] = [
        {
          clin_number: 'CLIN 001',
          description: 'Test',
          labor_categories: [
            { lcat: 'Dev', quantity: 1, rate: 100 },
          ],
        },
      ]

      const result = await generateCostModel(clins, 'Test')
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('generateRedTeamScorecard', () => {
    it('should generate a buffer with criteria data', async () => {
      const criteria: RedTeamCriterion[] = [
        {
          criteria: 'Technical Understanding',
          score: 8,
          max_score: 10,
          weaknesses: 'Minor gaps in cloud approach',
          recommended_fix: 'Add cloud migration details',
        },
        {
          criteria: 'Cost Realism',
          score: 3,
          max_score: 10,
          weaknesses: 'Below market rates',
          recommended_fix: 'Adjust labor rates',
        },
        {
          criteria: 'Past Performance',
          score: 5,
          max_score: 10,
          weaknesses: 'Limited federal experience',
          recommended_fix: 'Add subcontractor past perf',
        },
      ]

      const result = await generateRedTeamScorecard(criteria, 'Red Team Test')
      expect(result).toBeInstanceOf(Buffer)
      expect(mockAddWorksheet).toHaveBeenCalledWith('Red Team Scorecard', expect.any(Object))
    })

    it('should handle empty criteria', async () => {
      const result = await generateRedTeamScorecard([], 'Empty Scorecard')
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should handle zero max_score without division error', async () => {
      const criteria: RedTeamCriterion[] = [
        {
          criteria: 'Zero Max',
          score: 0,
          max_score: 0,
          weaknesses: 'N/A',
          recommended_fix: 'N/A',
        },
      ]

      const result = await generateRedTeamScorecard(criteria, 'Zero Test')
      expect(result).toBeInstanceOf(Buffer)
    })
  })
})
