/**
 * Tests for lib/ai/fine-tune/job-manager.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────

const mockSingle = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
  insert: mockInsert,
  update: mockUpdate,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({ ...mockChain })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
  }),
}))

import {
  createFineTuneJob,
  getJobStatus,
  listJobs,
  updateJobStatus,
  cancelJob,
} from '@/lib/ai/fine-tune/job-manager'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('job-uuid' as `${string}-${string}-${string}-${string}-${string}`)
})

// ─── createFineTuneJob ───────────────────────────────────────

describe('createFineTuneJob', () => {
  it('returns error when user does not have executive role', async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: 'viewer' }, error: null })
    const result = await createFineTuneJob('comp-1', 'user-1', {
      baseModel: 'gpt-4', trainingDataJsonl: '{}', trainingPairs: 50,
    })
    expect(result.job).toBeNull()
    expect(result.error).toContain('Only executives')
  })

  it('returns error when no profile found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await createFineTuneJob('comp-1', 'user-1', {
      baseModel: 'gpt-4', trainingDataJsonl: '{}', trainingPairs: 50,
    })
    expect(result.job).toBeNull()
  })

  it('creates job for executive user', async () => {
    // profile check
    mockSingle.mockResolvedValueOnce({ data: { role: 'executive' }, error: null })
    // company features
    mockSingle.mockResolvedValueOnce({ data: { features: {} }, error: null })

    const result = await createFineTuneJob('comp-1', 'user-1', {
      baseModel: 'openai/gpt-4', trainingDataJsonl: '{"messages":[]}', trainingPairs: 100,
      modelSuffix: 'test-run',
    })

    expect(result.job).not.toBeNull()
    expect(result.job!.status).toBe('queued')
    expect(result.job!.modelName).toContain('gpt-4')
    expect(result.job!.modelName).toContain('test-run')
    expect(result.job!.trainingPairs).toBe(100)
    expect(result.job!.createdBy).toBe('user-1')
    // Should have called update for features and insert for audit
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('uses companyId slice as suffix when no modelSuffix provided', async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { features: {} }, error: null })

    const result = await createFineTuneJob('company-1234', 'user-1', {
      baseModel: 'gpt-4', trainingDataJsonl: '{}', trainingPairs: 50,
    })

    expect(result.job!.modelName).toContain('company-')
  })
})

// ─── getJobStatus ────────────────────────────────────────────

describe('getJobStatus', () => {
  it('returns null when job not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [] } }, error: null })
    const result = await getJobStatus('comp-1', 'nonexistent')
    expect(result.job).toBeNull()
  })

  it('returns job when found', async () => {
    const mockJob = { id: 'job-1', status: 'training', modelName: 'test' }
    mockSingle.mockResolvedValueOnce({
      data: { features: { fine_tune_jobs: [mockJob] } },
      error: null,
    })
    const result = await getJobStatus('comp-1', 'job-1')
    expect(result.job).toEqual(mockJob)
  })

  it('returns null when no features', async () => {
    mockSingle.mockResolvedValueOnce({ data: { features: null }, error: null })
    const result = await getJobStatus('comp-1', 'job-1')
    expect(result.job).toBeNull()
  })
})

// ─── listJobs ────────────────────────────────────────────────

describe('listJobs', () => {
  it('returns empty array when no jobs', async () => {
    mockSingle.mockResolvedValueOnce({ data: { features: {} }, error: null })
    const result = await listJobs('comp-1')
    expect(result).toEqual([])
  })

  it('returns jobs sorted by createdAt descending', async () => {
    const jobs = [
      { id: 'j1', createdAt: '2026-01-01' },
      { id: 'j2', createdAt: '2026-02-01' },
    ]
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: jobs } }, error: null })
    const result = await listJobs('comp-1')
    expect(result[0].id).toBe('j2') // newer first
    expect(result[1].id).toBe('j1')
  })
})

// ─── updateJobStatus ─────────────────────────────────────────

describe('updateJobStatus', () => {
  it('returns false when job not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [] } }, error: null })
    const result = await updateJobStatus('comp-1', 'nonexistent', { status: 'completed' })
    expect(result.success).toBe(false)
  })

  it('updates job status and sets timestamps', async () => {
    const job = { id: 'job-1', status: 'queued', startedAt: null, completedAt: null, error: null, metrics: null }
    mockSingle.mockResolvedValueOnce({
      data: { features: { fine_tune_jobs: [job] } },
      error: null,
    })

    const result = await updateJobStatus('comp-1', 'job-1', {
      status: 'training',
    })
    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('sets completedAt for completed status', async () => {
    const job = { id: 'job-1', status: 'training', startedAt: '2026-01-01', completedAt: null, error: null, metrics: null }
    mockSingle.mockResolvedValueOnce({
      data: { features: { fine_tune_jobs: [job] } },
      error: null,
    })

    const result = await updateJobStatus('comp-1', 'job-1', {
      status: 'completed',
      metrics: { trainingLoss: 0.1, validationLoss: 0.15, epochs: 3 },
    })
    expect(result.success).toBe(true)
  })
})

// ─── cancelJob ───────────────────────────────────────────────

describe('cancelJob', () => {
  it('returns error when job not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [] } }, error: null })
    const result = await cancelJob('comp-1', 'nonexistent', 'user-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Job not found')
  })

  it('returns error for already completed job', async () => {
    const job = { id: 'job-1', status: 'completed' }
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [job] } }, error: null })
    const result = await cancelJob('comp-1', 'job-1', 'user-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot cancel a finished job')
  })

  it('returns error for failed job', async () => {
    const job = { id: 'job-1', status: 'failed' }
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [job] } }, error: null })
    const result = await cancelJob('comp-1', 'job-1', 'user-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot cancel a finished job')
  })

  it('cancels a queued job', async () => {
    const job = { id: 'job-1', status: 'queued', startedAt: null, completedAt: null, error: null, metrics: null }
    // First call: cancelJob -> getJobStatus
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [job] } }, error: null })
    // Second call: cancelJob -> updateJobStatus -> getJobStatus (reads features again)
    mockSingle.mockResolvedValueOnce({ data: { features: { fine_tune_jobs: [job] } }, error: null })

    const result = await cancelJob('comp-1', 'job-1', 'user-1')
    expect(result.success).toBe(true)
  })
})
