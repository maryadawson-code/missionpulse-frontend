/**
 * Fine-tune Training Data Exporter
 *
 * Exports accepted AI outputs as prompt/completion pairs in JSONL format.
 * Filters for quality: minimum confidence score, human-accepted only.
 * Used to prepare data for model fine-tuning.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface TrainingPair {
  prompt: string
  completion: string
  system: string
  metadata: {
    taskType: string
    confidence: string
    opportunityId: string | null
    acceptedAt: string
    acceptedBy: string | null
    tokens: number
  }
}

export interface ExportResult {
  pairs: TrainingPair[]
  totalExported: number
  totalFiltered: number
  jsonlContent: string
  qualityMetrics: {
    avgConfidence: number
    taskTypeDistribution: Record<string, number>
    dateRange: { from: string; to: string }
  }
}

export interface ExportConfig {
  minConfidence: 'high' | 'medium' | 'low' // Minimum confidence threshold
  humanAcceptedOnly: boolean // Only include human-accepted outputs
  taskTypes?: string[] // Filter by agent type (optional)
  dateFrom?: string // Start date (optional)
  dateTo?: string // End date (optional)
  maxPairs?: number // Max pairs to export (default 1000)
}

const DEFAULT_CONFIG: ExportConfig = {
  minConfidence: 'medium',
  humanAcceptedOnly: true,
  maxPairs: 1000,
}

// Confidence thresholds for numeric scores
const CONFIDENCE_THRESHOLDS = { high: 0.8, medium: 0.5, low: 0.0 }

// ─── Data Export ─────────────────────────────────────────────

/**
 * Export accepted AI outputs as training data.
 * Queries ai_approvals for reviewed outputs and ai_interactions for prompts.
 */
export async function exportTrainingData(
  companyId: string,
  config: Partial<ExportConfig> = {}
): Promise<ExportResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const supabase = await createClient()
  const minScore = CONFIDENCE_THRESHOLDS[cfg.minConfidence] ?? 0.5

  // Step 1: Get approved AI outputs from ai_approvals
  const { data: approvals } = await supabase
    .from('ai_approvals')
    .select('*')
    .eq('status', 'approved')
    .gte('confidence_score', minScore)
    .order('created_at', { ascending: false })
    .limit(cfg.maxPairs ?? 1000)

  if (!approvals || approvals.length === 0) {
    return {
      pairs: [],
      totalExported: 0,
      totalFiltered: 0,
      jsonlContent: '',
      qualityMetrics: {
        avgConfidence: 0,
        taskTypeDistribution: {},
        dateRange: { from: '', to: '' },
      },
    }
  }

  // Step 2: Get matching prompts from ai_interactions
  // Build a lookup by opportunity_id + agent_type for matching
  const { data: interactions } = await supabase
    .from('ai_interactions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(cfg.maxPairs ? cfg.maxPairs * 2 : 2000)

  const interactionLookup = new Map<string, { prompt: string; tokens: number }>()
  if (interactions) {
    for (const interaction of interactions) {
      const key = `${interaction.opportunity_id ?? ''}:${interaction.agent_type}`
      if (!interactionLookup.has(key)) {
        interactionLookup.set(key, {
          prompt: interaction.prompt,
          tokens: (interaction.tokens_input ?? 0) + (interaction.tokens_output ?? 0),
        })
      }
    }
  }

  // Step 3: Filter and transform
  let totalFiltered = 0
  const pairs: TrainingPair[] = []

  for (const approval of approvals) {
    const createdAt = approval.created_at ?? ''
    const agentType = approval.agent_type ?? ''

    // Agent type filter
    if (cfg.taskTypes && cfg.taskTypes.length > 0) {
      if (!cfg.taskTypes.includes(agentType)) {
        totalFiltered++
        continue
      }
    }

    // Date range filter
    if (cfg.dateFrom && createdAt < cfg.dateFrom) {
      totalFiltered++
      continue
    }
    if (cfg.dateTo && createdAt > cfg.dateTo) {
      totalFiltered++
      continue
    }

    // Look up the matching prompt
    const lookupKey = `${approval.opportunity_id ?? ''}:${agentType}`
    const interaction = interactionLookup.get(lookupKey)
    const prompt = interaction?.prompt ?? ''
    const completion = approval.ai_output ?? ''

    if (!prompt || !completion) {
      totalFiltered++
      continue
    }

    // Map numeric confidence to label
    const score = approval.confidence_score ?? 0
    const confidenceLabel = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'

    pairs.push({
      prompt,
      completion: approval.human_edited ?? completion,
      system: `You are a ${agentType} assistant for government contracting proposals.`,
      metadata: {
        taskType: agentType || 'unknown',
        confidence: confidenceLabel,
        opportunityId: approval.opportunity_id ?? null,
        acceptedAt: approval.reviewed_at ?? createdAt,
        acceptedBy: approval.reviewer_id ?? null,
        tokens: interaction?.tokens ?? 0,
      },
    })
  }

  // Generate JSONL
  const jsonlLines = pairs.map((pair) =>
    JSON.stringify({
      messages: [
        { role: 'system', content: pair.system },
        { role: 'user', content: pair.prompt },
        { role: 'assistant', content: pair.completion },
      ],
    })
  )
  const jsonlContent = jsonlLines.join('\n')

  // Quality metrics
  const taskDist: Record<string, number> = {}
  let totalConf = 0
  const confidenceOrder = { high: 3, medium: 2, low: 1 }
  for (const pair of pairs) {
    taskDist[pair.metadata.taskType] = (taskDist[pair.metadata.taskType] ?? 0) + 1
    totalConf += confidenceOrder[pair.metadata.confidence as keyof typeof confidenceOrder] ?? 0
  }

  const dates = pairs.map((p) => p.metadata.acceptedAt).filter(Boolean).sort()

  return {
    pairs,
    totalExported: pairs.length,
    totalFiltered,
    jsonlContent,
    qualityMetrics: {
      avgConfidence: pairs.length > 0 ? totalConf / pairs.length : 0,
      taskTypeDistribution: taskDist,
      dateRange: {
        from: dates[0] ?? '',
        to: dates[dates.length - 1] ?? '',
      },
    },
  }
}

/**
 * Validate training data quality before fine-tuning.
 */
export async function validateTrainingData(
  pairs: TrainingPair[]
): Promise<{
  valid: boolean
  issues: string[]
  stats: {
    totalPairs: number
    avgPromptLength: number
    avgCompletionLength: number
    uniqueTaskTypes: number
  }
}> {
  const issues: string[] = []

  if (pairs.length < 10) {
    issues.push(`Only ${pairs.length} pairs — minimum 10 recommended for fine-tuning`)
  }

  const promptLengths = pairs.map((p) => p.prompt.length)
  const completionLengths = pairs.map((p) => p.completion.length)
  const avgPrompt = promptLengths.reduce((a, b) => a + b, 0) / pairs.length
  const avgCompletion = completionLengths.reduce((a, b) => a + b, 0) / pairs.length

  if (avgCompletion < 50) {
    issues.push('Average completion length is very short — may not produce quality fine-tuning')
  }

  // Check for duplicate prompts
  const seenPrompts = new Set<string>()
  let duplicates = 0
  for (const pair of pairs) {
    const normalized = pair.prompt.toLowerCase().trim()
    if (seenPrompts.has(normalized)) duplicates++
    seenPrompts.add(normalized)
  }
  if (duplicates > pairs.length * 0.1) {
    issues.push(`${duplicates} duplicate prompts detected (>${Math.round(duplicates / pairs.length * 100)}%)`)
  }

  const taskTypes = new Set(pairs.map((p) => p.metadata.taskType))

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      totalPairs: pairs.length,
      avgPromptLength: Math.round(avgPrompt),
      avgCompletionLength: Math.round(avgCompletion),
      uniqueTaskTypes: taskTypes.size,
    },
  }
}
