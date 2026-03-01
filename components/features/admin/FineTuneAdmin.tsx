'use client'

import { useState } from 'react'
import {
  Brain,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { exportTrainingData, validateTrainingData } from '@/lib/ai/fine-tune/data-exporter'
import { createFineTuneJob, cancelJob } from '@/lib/ai/fine-tune/job-manager'
import type { FineTuneJob } from '@/lib/ai/fine-tune/job-manager'
import { addToast } from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────

interface FineTuneAdminProps {
  userId: string
  companyId: string
  initialJobs: FineTuneJob[]
}

// ─── Component ───────────────────────────────────────────────

export function FineTuneAdmin({ userId, companyId, initialJobs }: FineTuneAdminProps) {
  const [jobs, setJobs] = useState<FineTuneJob[]>(initialJobs)
  const [exporting, setExporting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [exportStats, setExportStats] = useState<{
    totalExported: number
    avgConfidence: number
    taskTypes: Record<string, number>
  } | null>(null)

  // Export training data
  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportTrainingData(companyId, {
        minConfidence: 'medium',
        humanAcceptedOnly: true,
      })

      if (result.totalExported === 0) {
        addToast('error', 'No training data found. Accept AI outputs to build training data.')
        return
      }

      // Validate
      const validation = await validateTrainingData(result.pairs)
      if (!validation.valid) {
        addToast('error', `Data quality issues: ${validation.issues[0]}`)
      }

      setExportStats({
        totalExported: result.totalExported,
        avgConfidence: result.qualityMetrics.avgConfidence,
        taskTypes: result.qualityMetrics.taskTypeDistribution,
      })

      // Trigger download
      const blob = new Blob([result.jsonlContent], { type: 'application/jsonl' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `missionpulse_training_${new Date().toISOString().split('T')[0]}.jsonl`
      a.click()
      URL.revokeObjectURL(url)

      addToast('success', `Exported ${result.totalExported} training pairs`)
    } catch {
      addToast('error', 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Create fine-tune job
  const handleCreateJob = async () => {
    setCreating(true)
    try {
      const exportResult = await exportTrainingData(companyId, {
        minConfidence: 'medium',
        humanAcceptedOnly: true,
      })

      if (exportResult.totalExported < 10) {
        addToast('error', 'Need at least 10 training pairs to create a fine-tune job')
        return
      }

      const result = await createFineTuneJob(companyId, userId, {
        baseModel: 'claude-sonnet',
        trainingDataJsonl: exportResult.jsonlContent,
        trainingPairs: exportResult.totalExported,
      })

      if (result.error) {
        addToast('error', result.error)
        return
      }

      if (result.job) {
        setJobs([result.job, ...jobs])
        addToast('success', 'Fine-tune job queued')
      }
    } catch {
      addToast('error', 'Failed to create job')
    } finally {
      setCreating(false)
    }
  }

  // Cancel job
  const handleCancel = async (jobId: string) => {
    const result = await cancelJob(companyId, jobId, userId)
    if (result.error) {
      addToast('error', result.error)
      return
    }
    setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' as const } : j)))
    addToast('success', 'Job cancelled')
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'training':
        return <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
      case 'queued':
      case 'validating':
        return <Clock className="h-4 w-4 text-yellow-400" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-border disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Training Data
        </button>
        <button
          onClick={handleCreateJob}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Start Fine-tuning
        </button>
      </div>

      {/* Export stats */}
      {exportStats && (
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Latest Export</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-cyan-400">{exportStats.totalExported}</p>
              <p className="text-xs text-muted-foreground">Training pairs</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {exportStats.avgConfidence.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg confidence</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {Object.keys(exportStats.taskTypes).length}
              </p>
              <p className="text-xs text-muted-foreground">Task types</p>
            </div>
          </div>
        </div>
      )}

      {/* Job list */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Fine-tune Jobs</h2>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
            <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No fine-tuning jobs yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Export and accept AI outputs to build training data, then start a job.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{job.modelName}</p>
                      <p className="text-xs text-muted-foreground">
                        Base: {job.baseModel} • {job.trainingPairs} pairs •{' '}
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : job.status === 'failed' || job.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400'
                            : job.status === 'training'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {job.status}
                    </span>

                    {(job.status === 'queued' || job.status === 'training') && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-400"
                        title="Cancel job"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                {job.metrics && (
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    {job.metrics.trainingLoss !== undefined && (
                      <span>Training loss: {job.metrics.trainingLoss.toFixed(4)}</span>
                    )}
                    {job.metrics.validationLoss !== undefined && (
                      <span>Validation loss: {job.metrics.validationLoss.toFixed(4)}</span>
                    )}
                    {job.metrics.epochs !== undefined && (
                      <span>Epochs: {job.metrics.epochs}</span>
                    )}
                  </div>
                )}

                {/* Error */}
                {job.error && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-400" />
                    <p className="text-xs text-red-400">{job.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
