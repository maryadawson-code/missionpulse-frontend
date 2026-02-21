/**
 * AI subsystem types — shared across all AI modules.
 * Server-only: never import from client components.
 */

// ─── Classification ──────────────────────────────────────────

export type ClassificationLevel =
  | 'UNCLASSIFIED'
  | 'CUI'
  | 'CUI//SP-PROPIN'
  | 'OPSEC'

export interface ClassificationResult {
  level: ClassificationLevel
  reasons: string[]
  patterns_matched: string[]
}

// ─── Models ──────────────────────────────────────────────────

export type AIEngine = 'asksage' | 'direct'

export type TaskType =
  | 'chat'
  | 'strategy'
  | 'compliance'
  | 'capture'
  | 'writer'
  | 'contracts'
  | 'orals'
  | 'pricing'
  | 'summarize'
  | 'classify'

export interface ModelConfig {
  model: string
  engine: AIEngine
  maxTokens: number
  temperature: number
  estimatedCostPer1k: number
}

export interface ModelSelection {
  primary: ModelConfig
  fallback: ModelConfig | null
  classification: ClassificationLevel
  budgetRemaining: number | null
}

// ─── Request / Response ──────────────────────────────────────

export interface AIRequestOptions {
  taskType: TaskType
  prompt: string
  context?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  opportunityId?: string
}

export interface AIResponse<T = string> {
  content: T
  model_used: string
  engine: AIEngine
  confidence: 'high' | 'medium' | 'low'
  citations: string[]
  tokens_in: number
  tokens_out: number
  latency_ms: number
  classification: ClassificationLevel
}

// ─── Errors ──────────────────────────────────────────────────

export type AIErrorCode =
  | 'RATE_LIMIT'
  | 'AUTH_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'BUDGET_EXCEEDED'
  | 'CLASSIFICATION_BLOCKED'
  | 'UNKNOWN'

export class AIError extends Error {
  code: AIErrorCode
  retryable: boolean

  constructor(code: AIErrorCode, message: string, retryable = false) {
    super(message)
    this.name = 'AIError'
    this.code = code
    this.retryable = retryable
  }
}

// ─── Token Usage ─────────────────────────────────────────────

export interface TokenUsageEntry {
  agent_id: string
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  user_id: string
  opportunity_id?: string
  metadata?: Record<string, unknown>
}
