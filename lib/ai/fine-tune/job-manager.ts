/**
 * Fine-tune Job Manager
 *
 * Manages fine-tuning jobs: trigger, monitor progress, and register
 * completed models in the model selector.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type JobStatus = 'queued' | 'validating' | 'training' | 'completed' | 'failed' | 'cancelled'

export interface FineTuneJob {
  id: string
  companyId: string
  status: JobStatus
  modelName: string
  baseModel: string
  trainingPairs: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  error: string | null
  metrics: {
    trainingLoss?: number
    validationLoss?: number
    epochs?: number
  } | null
  createdBy: string
}

export interface CreateJobParams {
  baseModel: string
  trainingDataJsonl: string
  trainingPairs: number
  modelSuffix?: string // Custom suffix for the model name
}

// ─── Job Management ──────────────────────────────────────────

/**
 * Create and queue a new fine-tuning job.
 * RBAC: executive only.
 */
export async function createFineTuneJob(
  companyId: string,
  userId: string,
  params: CreateJobParams
): Promise<{ job: FineTuneJob | null; error?: string }> {
  const supabase = await createClient()

  // Verify executive role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const executiveRoles = ['executive', 'admin', 'CEO', 'COO']
  if (!profile || !executiveRoles.includes(profile.role ?? '')) {
    return { job: null, error: 'Only executives can trigger fine-tuning jobs' }
  }

  const jobId = crypto.randomUUID()
  const modelName = `missionpulse-${params.baseModel.split('/').pop()}-${params.modelSuffix ?? companyId.slice(0, 8)}`
  const now = new Date().toISOString()

  const job: FineTuneJob = {
    id: jobId,
    companyId,
    status: 'queued',
    modelName,
    baseModel: params.baseModel,
    trainingPairs: params.trainingPairs,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    error: null,
    metrics: null,
    createdBy: userId,
  }

  // Store job in company metadata
  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features as Record<string, unknown>) ?? {}
  const existingJobs = (features.fine_tune_jobs as FineTuneJob[]) ?? []
  existingJobs.push(job)

  await supabase
    .from('companies')
    .update({
      features: JSON.parse(JSON.stringify({
        ...features,
        fine_tune_jobs: existingJobs,
      })),
    })
    .eq('id', companyId)

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'fine_tune_job_created',
    table_name: 'companies',
    record_id: jobId,
    user_id: userId,
    new_values: JSON.parse(JSON.stringify({
      job_id: jobId,
      base_model: params.baseModel,
      training_pairs: params.trainingPairs,
      model_name: modelName,
    })),
  })

  return { job }
}

/**
 * Get the status of a fine-tuning job.
 */
export async function getJobStatus(
  companyId: string,
  jobId: string
): Promise<{ job: FineTuneJob | null }> {
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features as Record<string, unknown>) ?? {}
  const jobs = (features.fine_tune_jobs as FineTuneJob[]) ?? []
  const job = jobs.find((j) => j.id === jobId) ?? null

  return { job }
}

/**
 * List all fine-tuning jobs for a company.
 */
export async function listJobs(companyId: string): Promise<FineTuneJob[]> {
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features as Record<string, unknown>) ?? {}
  const jobs = (features.fine_tune_jobs as FineTuneJob[]) ?? []

  return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Update a job's status and metrics.
 * Called by webhook or polling mechanism.
 */
export async function updateJobStatus(
  companyId: string,
  jobId: string,
  update: {
    status: JobStatus
    error?: string
    metrics?: FineTuneJob['metrics']
  }
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features as Record<string, unknown>) ?? {}
  const jobs = (features.fine_tune_jobs as FineTuneJob[]) ?? []
  const jobIndex = jobs.findIndex((j) => j.id === jobId)

  if (jobIndex === -1) return { success: false }

  const job = jobs[jobIndex]
  job.status = update.status
  if (update.error) job.error = update.error
  if (update.metrics) job.metrics = update.metrics

  if (update.status === 'training' && !job.startedAt) {
    job.startedAt = new Date().toISOString()
  }
  if (update.status === 'completed' || update.status === 'failed') {
    job.completedAt = new Date().toISOString()
  }

  await supabase
    .from('companies')
    .update({
      features: JSON.parse(JSON.stringify({ ...features, fine_tune_jobs: jobs })),
    })
    .eq('id', companyId)

  return { success: true }
}

/**
 * Cancel a queued or training job.
 */
export async function cancelJob(
  companyId: string,
  jobId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { job } = await getJobStatus(companyId, jobId)
  if (!job) return { success: false, error: 'Job not found' }
  if (job.status === 'completed' || job.status === 'failed') {
    return { success: false, error: 'Cannot cancel a finished job' }
  }

  await updateJobStatus(companyId, jobId, { status: 'cancelled' })

  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    action: 'fine_tune_job_cancelled',
    table_name: 'companies',
    record_id: jobId,
    user_id: userId,
  })

  return { success: true }
}
