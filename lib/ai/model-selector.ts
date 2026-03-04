/**
 * Model Selection Engine — selects optimal model per task + classification.
 * Supports cascade (cheap first, escalate) and budget guard.
 */
'use server'

import { createLogger } from '@/lib/logging/logger'
import type {
  TaskType,
  ClassificationLevel,
  ModelConfig,
  ModelSelection,
} from './types'
import { createClient } from '@/lib/supabase/server'

// ─── Model Catalog ───────────────────────────────────────────
// Per Product Spec Section 6.3 — task-to-model mapping

const MODELS: Record<string, ModelConfig> = {
  'claude-haiku': {
    model: 'claude-haiku-4-5',
    engine: 'asksage',
    maxTokens: 4096,
    temperature: 0.3,
    estimatedCostPer1k: 0.00025,
  },
  'claude-sonnet': {
    model: 'claude-sonnet-4-5',
    engine: 'asksage',
    maxTokens: 8192,
    temperature: 0.5,
    estimatedCostPer1k: 0.003,
  },
  'claude-opus': {
    model: 'claude-opus-4',
    engine: 'asksage',
    maxTokens: 8192,
    temperature: 0.7,
    estimatedCostPer1k: 0.015,
  },
  'gpt-4o': {
    model: 'gpt-4o',
    engine: 'asksage',
    maxTokens: 4096,
    temperature: 0.5,
    estimatedCostPer1k: 0.005,
  },
}

// ─── Task-Model Mapping ──────────────────────────────────────

const TASK_MODEL_MAP: Record<TaskType, { primary: string; fallback: string }> =
  {
    chat: { primary: 'claude-sonnet', fallback: 'claude-haiku' },
    strategy: { primary: 'claude-opus', fallback: 'claude-sonnet' },
    compliance: { primary: 'claude-sonnet', fallback: 'claude-haiku' },
    capture: { primary: 'claude-sonnet', fallback: 'claude-haiku' },
    writer: { primary: 'claude-opus', fallback: 'claude-sonnet' },
    contracts: { primary: 'claude-sonnet', fallback: 'claude-haiku' },
    orals: { primary: 'claude-opus', fallback: 'claude-sonnet' },
    pricing: { primary: 'gpt-4o', fallback: 'claude-sonnet' },
    summarize: { primary: 'claude-haiku', fallback: 'claude-haiku' },
    classify: { primary: 'claude-haiku', fallback: 'claude-haiku' },
  }

// ─── Budget Guard ────────────────────────────────────────────

const MONTHLY_BUDGET_USD = Number(process.env.AI_MONTHLY_BUDGET_USD ?? '500')
const BUDGET_WARNING_THRESHOLD = 0.75

async function checkBudget(): Promise<{
  spent: number
  remaining: number
  overThreshold: boolean
}> {
  try {
    const supabase = await createClient()

    // Get spend for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('token_usage')
      .select('estimated_cost_usd')
      .gte('created_at', startOfMonth.toISOString())

    const spent = (data ?? []).reduce(
      (sum, row) => sum + (row.estimated_cost_usd ?? 0),
      0
    )
    const remaining = MONTHLY_BUDGET_USD - spent

    return {
      spent,
      remaining,
      overThreshold: spent >= MONTHLY_BUDGET_USD * BUDGET_WARNING_THRESHOLD,
    }
  } catch {
    // If budget check fails, allow the request but log warning
    createLogger('model-selector').warn('Budget check failed — allowing request')
    return { spent: 0, remaining: MONTHLY_BUDGET_USD, overThreshold: false }
  }
}

// ─── Selection ───────────────────────────────────────────────

export async function selectModel(
  taskType: TaskType,
  classification: ClassificationLevel
): Promise<ModelSelection> {
  const mapping = TASK_MODEL_MAP[taskType] ?? TASK_MODEL_MAP.chat
  const budget = await checkBudget()

  let primaryKey = mapping.primary
  const fallbackKey = mapping.fallback

  // If over budget threshold, downgrade to cheaper model
  if (budget.overThreshold && primaryKey !== 'claude-haiku') {
    createLogger('model-selector').warn('Budget threshold exceeded — downgrading model', {
      budgetPct: ((budget.spent / MONTHLY_BUDGET_USD) * 100).toFixed(0),
    })
    primaryKey = fallbackKey
  }

  // CUI-classified content: ensure AskSage engine
  const primary = { ...MODELS[primaryKey] }
  const fallback = fallbackKey !== primaryKey ? { ...MODELS[fallbackKey] } : null

  if (classification !== 'UNCLASSIFIED') {
    primary.engine = 'asksage'
    if (fallback) fallback.engine = 'asksage'
  }

  return {
    primary,
    fallback,
    classification,
    budgetRemaining: budget.remaining,
  }
}
