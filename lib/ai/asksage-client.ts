/**
 * AskSage API Client — Server-only module.
 * Wraps the AskSage REST API with auth, retry logic, token tracking.
 *
 * IMPORTANT: This module must NEVER be imported from client components.
 * All AI operations go through server actions.
 */
'use server'

import { createLogger } from '@/lib/logging/logger'
import { AIError } from './types'
import type { AIErrorCode } from './types'

// ─── Config ──────────────────────────────────────────────────

const ASKSAGE_API_URL =
  process.env.ASKSAGE_API_URL ?? 'https://api.asksage.ai/v1'
const ASKSAGE_API_KEY = process.env.ASKSAGE_API_KEY ?? ''

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

// ─── Types ───────────────────────────────────────────────────

interface AskSageRequest {
  model: string
  prompt: string
  system_prompt?: string
  max_tokens?: number
  temperature?: number
  context?: string
}

interface AskSageResponse {
  response: string
  model: string
  tokens_used: {
    input: number
    output: number
    total: number
  }
}

// ─── Client ──────────────────────────────────────────────────

export async function queryAskSage(
  request: AskSageRequest
): Promise<AskSageResponse> {
  if (!ASKSAGE_API_KEY) {
    // Graceful degradation when API key not configured
    createLogger('asksage').warn('No API key configured — returning mock response')
    return mockResponse(request)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${ASKSAGE_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ASKSAGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          system_prompt: request.system_prompt ?? '',
          max_tokens: request.max_tokens ?? 2048,
          temperature: request.temperature ?? 0.7,
          context: request.context ?? '',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          response: data.response ?? data.content ?? '',
          model: data.model ?? request.model,
          tokens_used: {
            input: data.tokens_used?.input ?? estimateTokens(request.prompt),
            output:
              data.tokens_used?.output ??
              estimateTokens(data.response ?? ''),
            total: data.tokens_used?.total ?? 0,
          },
        }
      }

      // Map HTTP status to error code
      const errorCode = mapHttpStatus(response.status)
      const errorBody = await response.text().catch(() => '')
      lastError = new AIError(
        errorCode,
        `AskSage ${response.status}: ${errorBody}`,
        errorCode === 'RATE_LIMIT' || errorCode === 'TIMEOUT'
      )

      if (!(lastError as AIError).retryable) {
        throw lastError
      }
    } catch (err) {
      if (err instanceof AIError && !err.retryable) throw err
      lastError =
        err instanceof Error ? err : new Error('Unknown error')

      if (
        err instanceof DOMException &&
        err.name === 'TimeoutError'
      ) {
        lastError = new AIError('TIMEOUT', 'AskSage request timed out', true)
      }
    }

    // Exponential backoff
    if (attempt < MAX_RETRIES - 1) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt))
    }
  }

  throw (
    lastError ?? new AIError('UNKNOWN', 'All retries exhausted', false)
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function mapHttpStatus(status: number): AIErrorCode {
  switch (status) {
    case 401:
    case 403:
      return 'AUTH_ERROR'
    case 429:
      return 'RATE_LIMIT'
    case 503:
    case 502:
      return 'MODEL_UNAVAILABLE'
    case 408:
    case 504:
      return 'TIMEOUT'
    default:
      return 'UNKNOWN'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

function mockResponse(request: AskSageRequest): AskSageResponse {
  const mockContent =
    'AI features require an AskSage API key. Configure ASKSAGE_API_KEY in your environment to enable AI-powered responses.'

  return {
    response: mockContent,
    model: request.model,
    tokens_used: {
      input: estimateTokens(request.prompt),
      output: estimateTokens(mockContent),
      total:
        estimateTokens(request.prompt) + estimateTokens(mockContent),
    },
  }
}
