import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────

const mockGetUser = vi.fn()

function createChainMock(terminalValue: unknown = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['select', 'eq', 'order', 'limit']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single = vi.fn().mockResolvedValue(terminalValue)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  return chain
}

// Table-based mock: each call to from(table) returns a chain for that table
const tableMocks: Record<string, ReturnType<typeof createChainMock>> = {}

function setTableMock(table: string, chain: ReturnType<typeof createChainMock>) {
  tableMocks[table] = chain
}

const mockFrom = vi.fn().mockImplementation((table: string) => {
  return tableMocks[table] ?? createChainMock()
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}))

import { createRule, updateRule, deleteRule, getRulesByCompany } from '@/lib/sync/coordination-rules'

// ─── Tests ──────────────────────────────────────────────────

describe('coordination-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear table mocks
    for (const key of Object.keys(tableMocks)) {
      delete tableMocks[key]
    }
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    // Re-attach the implementation after clearAllMocks
    mockFrom.mockImplementation((table: string) => {
      return tableMocks[table] ?? createChainMock()
    })
  })

  // ── createRule ──────────────────────────────────────────

  describe('createRule', () => {
    const validRule = {
      company_id: 'comp-1',
      source_doc_type: 'cover_letter',
      source_field_path: 'title',
      target_doc_type: 'executive_summary',
      target_field_path: 'project_name',
      transform_type: 'copy' as const,
      is_active: true,
      description: 'Copy title',
    }

    it('should return error if not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await createRule(validRule as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Not authenticated')
    })

    it('should return error for invalid source doc type', async () => {
      const result = await createRule({ ...validRule, source_doc_type: 'invalid_type' } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid source document type')
    })

    it('should return error for invalid target doc type', async () => {
      const result = await createRule({ ...validRule, target_doc_type: 'invalid_type' } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid target document type')
    })

    it('should return error for invalid transform type', async () => {
      const result = await createRule({ ...validRule, transform_type: 'invalid' } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid transform type')
    })

    it('should return error for empty source field path', async () => {
      const result = await createRule({ ...validRule, source_field_path: '  ' } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Source field path is required')
    })

    it('should return error for empty target field path', async () => {
      const result = await createRule({ ...validRule, target_field_path: '' } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Target field path is required')
    })

    it('should return error for self-referencing rule', async () => {
      const result = await createRule({
        ...validRule,
        source_doc_type: 'cover_letter',
        target_doc_type: 'cover_letter',
        source_field_path: 'title',
        target_field_path: 'title',
      } as any)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Source and target cannot be the same')
    })

    it('should succeed when valid', async () => {
      const rulesChain = createChainMock({ data: { id: 'rule-1' }, error: null })
      rulesChain.insert = vi.fn().mockReturnValue(rulesChain)
      setTableMock('coordination_rules', rulesChain)

      const auditChain = createChainMock()
      auditChain.insert = vi.fn().mockResolvedValue({ error: null })
      setTableMock('audit_logs', auditChain)

      const result = await createRule(validRule as any)
      expect(result.success).toBe(true)
    })

    it('should return error on insert failure', async () => {
      const rulesChain = createChainMock({ data: null, error: { message: 'DB error' } })
      rulesChain.insert = vi.fn().mockReturnValue(rulesChain)
      setTableMock('coordination_rules', rulesChain)

      const result = await createRule(validRule as any)
      expect(result.success).toBe(false)
    })
  })

  // ── updateRule ──────────────────────────────────────────

  describe('updateRule', () => {
    it('should return error if not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await updateRule('rule-1', { is_active: false })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Not authenticated')
    })

    it('should return error if rule not found', async () => {
      const rulesChain = createChainMock({ data: null, error: { message: 'not found' } })
      setTableMock('coordination_rules', rulesChain)

      const result = await updateRule('rule-1', { is_active: false })
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error for invalid transform type', async () => {
      const rulesChain = createChainMock({ data: { id: 'rule-1', company_id: 'c1' }, error: null })
      setTableMock('coordination_rules', rulesChain)

      const result = await updateRule('rule-1', { transform_type: 'invalid' as any })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid transform type')
    })

    it('should return error for empty source field path', async () => {
      const rulesChain = createChainMock({ data: { id: 'rule-1', company_id: 'c1' }, error: null })
      setTableMock('coordination_rules', rulesChain)

      const result = await updateRule('rule-1', { source_field_path: '  ' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })

    it('should return error for empty target field path', async () => {
      const rulesChain = createChainMock({ data: { id: 'rule-1', company_id: 'c1' }, error: null })
      setTableMock('coordination_rules', rulesChain)

      const result = await updateRule('rule-1', { target_field_path: '  ' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })

    it('should succeed with valid updates', async () => {
      const rulesChain = createChainMock({ data: { id: 'rule-1', company_id: 'c1' }, error: null })
      rulesChain.update = vi.fn().mockReturnValue(rulesChain)
      // The eq after update resolves the update promise
      rulesChain.eq = vi.fn().mockImplementation(() => {
        // For select().eq().single() it returns the chain
        // For update().eq() it resolves the update
        return rulesChain
      })
      setTableMock('coordination_rules', rulesChain)

      const auditChain = createChainMock()
      auditChain.insert = vi.fn().mockResolvedValue({ error: null })
      setTableMock('audit_logs', auditChain)

      const result = await updateRule('rule-1', { is_active: false, description: 'Updated' })
      expect(result.success).toBe(true)
    })
  })

  // ── deleteRule ──────────────────────────────────────────

  describe('deleteRule', () => {
    it('should return error if not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const result = await deleteRule('rule-1')
      expect(result.success).toBe(false)
    })

    it('should return error if rule not found', async () => {
      const rulesChain = createChainMock({ data: null, error: { message: 'not found' } })
      setTableMock('coordination_rules', rulesChain)

      const result = await deleteRule('rule-1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should soft-delete and audit log on success', async () => {
      const rulesChain = createChainMock({
        data: { id: 'rule-1', description: 'test', source_doc_type: 'cover_letter', target_doc_type: 'resume' },
        error: null,
      })
      rulesChain.update = vi.fn().mockReturnValue(rulesChain)
      setTableMock('coordination_rules', rulesChain)

      const auditChain = createChainMock()
      auditChain.insert = vi.fn().mockResolvedValue({ error: null })
      setTableMock('audit_logs', auditChain)

      const result = await deleteRule('rule-1')
      expect(result.success).toBe(true)
    })
  })

  // ── getRulesByCompany ───────────────────────────────────

  describe('getRulesByCompany', () => {
    it('should return empty array on error', async () => {
      const chain = createChainMock()
      chain.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
      setTableMock('coordination_rules', chain)

      const result = await getRulesByCompany('comp-1')
      expect(result).toEqual([])
    })

    it('should return rules array', async () => {
      const rules = [{ id: 'r1' }, { id: 'r2' }]
      const chain = createChainMock()
      chain.order = vi.fn().mockResolvedValue({ data: rules, error: null })
      setTableMock('coordination_rules', chain)

      const result = await getRulesByCompany('comp-1')
      expect(result).toEqual(rules)
    })
  })
})
