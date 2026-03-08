import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockFrom = vi.fn()

function createChainMock(terminalValue: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'contains']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single = vi.fn().mockResolvedValue(terminalValue)
  chain.insert = vi.fn().mockResolvedValue({ error: null })
  chain.delete = vi.fn().mockReturnValue(chain)
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  })),
}))

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'batch-uuid-123' })

import { validateRecords, importBatch, undoImportBatch } from '@/lib/migration/validator'
import type { ValidatedRecord } from '@/lib/migration/validator'

// ─── Tests ──────────────────────────────────────────────────

describe('validator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no existing titles
    const chain = createChainMock()
    chain.limit = vi.fn().mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
  })

  describe('validateRecords', () => {
    it('should validate records with all required fields', async () => {
      const records = [
        { title: 'Test Opportunity', agency: 'DoD', pwin: 50 },
      ]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.valid).toBe(true)
      expect(result.summary.total).toBe(1)
      expect(result.summary.valid).toBe(1)
      expect(result.summary.errors).toBe(0)
    })

    it('should flag missing required fields as errors', async () => {
      const records = [{ agency: 'DoD' }] // missing title

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.valid).toBe(false)
      expect(result.summary.errors).toBe(1)
      expect(result.records[0].issues[0].message).toContain('title')
    })

    it('should flag empty string required fields', async () => {
      const records = [{ title: '   ' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.valid).toBe(false)
    })

    it('should validate ceiling as positive number', async () => {
      const records = [
        { title: 'Opp 1', ceiling: 'not-a-number' },
        { title: 'Opp 2', ceiling: -100 },
      ]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const opp1Issues = result.records[0].issues.filter((i) => i.field === 'ceiling')
      expect(opp1Issues.length).toBe(1)
      expect(opp1Issues[0].type).toBe('error')

      const opp2Issues = result.records[1].issues.filter((i) => i.field === 'ceiling')
      expect(opp2Issues.length).toBe(1)
    })

    it('should validate pWin range 0-100', async () => {
      const records = [
        { title: 'Opp 1', pwin: 150 },
        { title: 'Opp 2', pwin: 'abc' },
      ]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const opp1Issues = result.records[0].issues.filter((i) => i.field === 'pwin')
      expect(opp1Issues[0].type).toBe('warning')

      const opp2Issues = result.records[1].issues.filter((i) => i.field === 'pwin')
      expect(opp2Issues[0].type).toBe('error')
    })

    it('should validate phase against known values', async () => {
      const records = [{ title: 'Opp', phase: 'Invalid Phase' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const phaseIssues = result.records[0].issues.filter((i) => i.field === 'phase')
      expect(phaseIssues.length).toBe(1)
      expect(phaseIssues[0].type).toBe('warning')
    })

    it('should accept valid phases', async () => {
      const records = [{ title: 'Opp', phase: 'Capture Planning' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const phaseIssues = result.records[0].issues.filter((i) => i.field === 'phase')
      expect(phaseIssues.length).toBe(0)
    })

    it('should warn about past deadlines', async () => {
      const records = [{ title: 'Opp', deadline: '2020-01-01' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const deadlineIssues = result.records[0].issues.filter((i) => i.field === 'deadline')
      expect(deadlineIssues.length).toBe(1)
      expect(deadlineIssues[0].type).toBe('warning')
    })

    it('should error on invalid deadline format', async () => {
      const records = [{ title: 'Opp', deadline: 'not-a-date' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const deadlineIssues = result.records[0].issues.filter((i) => i.field === 'deadline')
      expect(deadlineIssues[0].type).toBe('error')
    })

    it('should warn about invalid NAICS code', async () => {
      const records = [{ title: 'Opp', naics_code: '12345' }] // Should be 6 digits

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const naicsIssues = result.records[0].issues.filter((i) => i.field === 'naics_code')
      expect(naicsIssues.length).toBe(1)
    })

    it('should warn about invalid email format', async () => {
      const records = [{ title: 'Opp', contact_email: 'not-an-email' }]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      const emailIssues = result.records[0].issues.filter((i) => i.field === 'contact_email')
      expect(emailIssues.length).toBe(1)
    })

    it('should detect duplicate titles within batch', async () => {
      const records = [
        { title: 'Same Title' },
        { title: 'Same Title' },
      ]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.summary.duplicates).toBeGreaterThan(0)
    })

    it('should detect duplicates against existing database records', async () => {
      const chain = createChainMock()
      chain.limit = vi.fn().mockResolvedValue({
        data: [{ title: 'Existing Opp' }],
        error: null,
      })
      mockFrom.mockReturnValue(chain)

      const records = [{ title: 'Existing Opp' }]
      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.summary.duplicates).toBeGreaterThan(0)
    })

    // Contact validation
    it('should validate contact email', async () => {
      const records = [{ full_name: 'John', email: 'bad-email' }]

      const result = await validateRecords(records, 'contacts', 'comp-1')
      const emailIssues = result.records[0].issues.filter((i) => i.field === 'email')
      expect(emailIssues.length).toBe(1)
      expect(emailIssues[0].type).toBe('error')
    })

    it('should warn about incomplete phone number', async () => {
      const records = [{ full_name: 'John', phone: '12345' }]

      const result = await validateRecords(records, 'contacts', 'comp-1')
      const phoneIssues = result.records[0].issues.filter((i) => i.field === 'phone')
      expect(phoneIssues.length).toBe(1)
    })

    // Past performance validation
    it('should validate past performance value', async () => {
      const records = [{ title: 'Contract', value: -1000 }]

      const result = await validateRecords(records, 'past_performance', 'comp-1')
      const valueIssues = result.records[0].issues.filter((i) => i.field === 'value')
      expect(valueIssues.length).toBe(1)
    })

    it('should error when end_date before start_date', async () => {
      const records = [{ title: 'Contract', start_date: '2025-06-01', end_date: '2025-01-01' }]

      const result = await validateRecords(records, 'past_performance', 'comp-1')
      const dateIssues = result.records[0].issues.filter((i) => i.field === 'end_date')
      expect(dateIssues.length).toBe(1)
    })

    it('should compute summary correctly', async () => {
      const records = [
        { title: 'Valid' },
        { title: '' }, // error: missing required
        { title: 'Valid 2', phase: 'Unknown' }, // warning
      ]

      const result = await validateRecords(records, 'opportunities', 'comp-1')
      expect(result.summary.total).toBe(3)
      expect(result.summary.errors).toBe(1)
      expect(result.summary.warnings).toBe(1)
      expect(result.summary.valid).toBe(1)
    })
  })

  describe('importBatch', () => {
    it('should return error for empty importable records', async () => {
      const records: ValidatedRecord[] = [
        { index: 0, data: { title: '' }, status: 'error', issues: [] },
      ]

      const result = await importBatch(records, 'opportunities', 'comp-1', 'user-1')
      expect(result.imported).toBe(0)
      expect(result.error).toContain('No valid records')
    })

    it('should import valid records', async () => {
      const chain = createChainMock()
      chain.insert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(chain)

      const records: ValidatedRecord[] = [
        { index: 0, data: { title: 'Test Opp', agency: 'DoD' }, status: 'valid', issues: [] },
      ]

      const result = await importBatch(records, 'opportunities', 'comp-1', 'user-1')
      expect(result.imported).toBe(1)
      expect(result.batchId).toBe('batch-uuid-123')
    })

    it('should skip error records but import warnings', async () => {
      const chain = createChainMock()
      chain.insert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(chain)

      const records: ValidatedRecord[] = [
        { index: 0, data: { title: 'Good' }, status: 'valid', issues: [] },
        { index: 1, data: { title: '' }, status: 'error', issues: [] },
        { index: 2, data: { title: 'Warn' }, status: 'warning', issues: [] },
      ]

      const result = await importBatch(records, 'opportunities', 'comp-1', 'user-1')
      expect(result.imported).toBe(2)
    })

    it('should return error on database failure', async () => {
      const chain = createChainMock()
      chain.insert = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
      mockFrom.mockReturnValue(chain)

      const records: ValidatedRecord[] = [
        { index: 0, data: { title: 'Test' }, status: 'valid', issues: [] },
      ]

      const result = await importBatch(records, 'opportunities', 'comp-1', 'user-1')
      expect(result.imported).toBe(0)
      expect(result.error).toBe('DB error')
    })
  })

  describe('undoImportBatch', () => {
    it('should return error if batch not found', async () => {
      const chain = createChainMock({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await undoImportBatch('batch-1', 'opportunities', 'user-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error if undo window expired', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      const chain = createChainMock({ data: { created_at: oldDate }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await undoImportBatch('batch-1', 'opportunities', 'user-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should undo a recent batch', async () => {
      const recentDate = new Date().toISOString()

      const auditChain = createChainMock({ data: { created_at: recentDate }, error: null })
      const deleteChain = createChainMock()
      deleteChain.select = vi.fn().mockResolvedValue({ data: [{ id: 'o1' }, { id: 'o2' }], error: null })
      const logChain = createChainMock()
      logChain.insert = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return auditChain // audit_logs select
        if (callCount === 2) return deleteChain // opportunities delete
        return logChain // audit_logs insert
      })

      const result = await undoImportBatch('batch-1', 'opportunities', 'user-1')
      expect(result.success).toBe(true)
      expect(result.deleted).toBe(2)
    })

    it('should return error for unsupported import type undo', async () => {
      const recentDate = new Date().toISOString()
      const chain = createChainMock({ data: { created_at: recentDate }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await undoImportBatch('batch-1', 'contacts', 'user-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not supported')
    })
  })
})
