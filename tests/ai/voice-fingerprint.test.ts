/**
 * Tests for lib/ai/voice-fingerprint.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────

const mockSingle = vi.fn()
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockInsert = vi.fn().mockResolvedValue({ error: null })

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
  update: mockUpdate,
  insert: mockInsert,
}

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({ ...mockChain })),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}))

vi.mock('@/lib/ai/pipeline', () => ({
  aiRequest: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      topTerms: [{ term: 'interoperability', frequency: 15 }],
      preferredTransitions: ['furthermore', 'additionally'],
      formalityScore: 80,
      technicalDepth: 75,
      assertiveness: 70,
      persuasionStyle: 'data-driven',
      samplePhrases: ['Our proven methodology', 'Demonstrated capability'],
      avoidedTerms: ['leverage', 'synergy'],
      promptModifier: 'Write in a formal, evidence-based tone.',
    }),
    model: 'test',
  }),
}))

import {
  generateVoiceProfile,
  getVoiceProfile,
  updateVoiceProfileModifier,
} from '@/lib/ai/voice-fingerprint'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid' as `${string}-${string}-${string}-${string}-${string}`)
})

const sampleDocs = [
  'Our company has extensive experience deploying FHIR R4 interfaces across 12 Military Treatment Facilities. We have successfully completed ATO processes under DoD RMF for 8 healthcare systems. Our team includes 15 Oracle Health-certified engineers who have been instrumental in the MHS GENESIS deployment.',
  'The technical approach leverages a phased integration methodology. Phase 1 focuses on ADT interfaces. Phase 2 addresses clinical documentation workflows. Phase 3 implements the complete FHIR R4 resource set. Each phase includes validation testing with 100% test patient coverage.',
  'Past performance demonstrates our capability to deliver on-time across multiple DHA networks. We completed the Southeast Defense Health Network deployment 2 weeks ahead of schedule. Our CMMC Level 2 certification was achieved in Q3 2025. We maintain FedRAMP High authorization for all cloud components.',
]

// ─── generateVoiceProfile ────────────────────────────────────

describe('generateVoiceProfile', () => {
  it('returns error when fewer than 3 documents provided', async () => {
    const result = await generateVoiceProfile(['doc1', 'doc2'])
    expect(result.profile).toBeNull()
    expect(result.error).toContain('At least 3 documents')
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await generateVoiceProfile(sampleDocs)
    expect(result.profile).toBeNull()
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user has no company', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: null, role: 'executive' }, error: null })
    const result = await generateVoiceProfile(sampleDocs)
    expect(result.profile).toBeNull()
    expect(result.error).toBe('No company')
  })

  it('returns error when user role is not allowed', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'viewer' }, error: null })
    const result = await generateVoiceProfile(sampleDocs)
    expect(result.profile).toBeNull()
    expect(result.error).toBe('Insufficient permissions')
  })

  it('generates voice profile for authorized user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    // profile query
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'executive' }, error: null })
    // company features query
    mockSingle.mockResolvedValueOnce({ data: { features: {} }, error: null })

    const result = await generateVoiceProfile(sampleDocs)
    expect(result.profile).not.toBeNull()
    expect(result.profile!.companyId).toBe('comp-1')
    expect(result.profile!.sourceDocCount).toBe(3)
    expect(result.profile!.vocabulary.topTerms).toHaveLength(1)
    expect(result.profile!.tone.persuasionStyle).toBe('data-driven')
    expect(result.profile!.promptModifier).toBe('Write in a formal, evidence-based tone.')
  })
})

// ─── getVoiceProfile ─────────────────────────────────────────

describe('getVoiceProfile', () => {
  it('returns null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await getVoiceProfile()
    expect(result).toBeNull()
  })

  it('returns null when user has no company', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: null }, error: null })
    const result = await getVoiceProfile()
    expect(result).toBeNull()
  })

  it('returns null when no voice profile exists', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1' }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { features: {} }, error: null })
    const result = await getVoiceProfile()
    expect(result).toBeNull()
  })

  it('returns voice profile when it exists', async () => {
    const mockProfile = { id: 'vp-1', companyId: 'comp-1', promptModifier: 'Formal tone.' }
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1' }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { features: { voice_profile: mockProfile } }, error: null })
    const result = await getVoiceProfile()
    expect(result).toEqual(mockProfile)
  })
})

// ─── updateVoiceProfileModifier ──────────────────────────────

describe('updateVoiceProfileModifier', () => {
  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await updateVoiceProfileModifier('New modifier')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user has no company', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: null, role: 'executive' }, error: null })
    const result = await updateVoiceProfileModifier('New modifier')
    expect(result.success).toBe(false)
    expect(result.error).toBe('No company')
  })

  it('returns error for unauthorized role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'viewer' }, error: null })
    const result = await updateVoiceProfileModifier('New modifier')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Insufficient permissions')
  })

  it('updates modifier for authorized user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'CEO' }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { features: { voice_profile: { promptModifier: 'Old' } } }, error: null })

    const result = await updateVoiceProfileModifier('New formal tone modifier')
    expect(result.success).toBe(true)
  })
})
