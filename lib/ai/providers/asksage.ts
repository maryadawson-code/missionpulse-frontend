/**
 * AskSage Provider — FedRAMP-authorized AI gateway.
 * Primary provider for all CUI-classified requests.
 * Refactored from lib/ai/asksage-client.ts into provider interface.
 */
'use server'

import { AIError } from '../types'
import type { AIErrorCode } from '../types'
import { classifyContent } from './classify-shared'
import type {
  AIProvider,
  ProviderQueryRequest,
  ProviderQueryResponse,
  ProviderClassifyRequest,
  ProviderClassifyResponse,
} from './interface'

// ─── Config ──────────────────────────────────────────────────

const ASKSAGE_API_URL =
  process.env.ASKSAGE_API_URL ?? 'https://api.asksage.ai/v1'
const ASKSAGE_API_KEY = process.env.ASKSAGE_API_KEY ?? ''

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

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
  return Math.ceil(text.length / 4)
}

// ─── Provider Implementation ────────────────────────────────

export async function createAskSageProvider(): Promise<AIProvider> {
  const provider: AIProvider = {
    id: 'asksage',
    name: 'AskSage (FedRAMP)',
    isFedRAMPAuthorized: true,

    isConfigured() {
      return Boolean(ASKSAGE_API_KEY)
    },

    async query(request: ProviderQueryRequest): Promise<ProviderQueryResponse> {
      if (!ASKSAGE_API_KEY) {
        const mockContent =
          'AI features require an AskSage API key. Configure ASKSAGE_API_KEY in your environment.'
        return {
          content: mockContent,
          model: request.model,
          tokensUsed: {
            input: estimateTokens(request.prompt),
            output: estimateTokens(mockContent),
            total: estimateTokens(request.prompt) + estimateTokens(mockContent),
          },
          provider: 'asksage',
        }
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
              system_prompt: request.systemPrompt ?? '',
              max_tokens: request.maxTokens ?? 2048,
              temperature: request.temperature ?? 0.7,
              context: request.context ?? '',
            }),
            signal: AbortSignal.timeout(30000),
          })

          if (response.ok) {
            const data = await response.json()
            return {
              content: data.response ?? data.content ?? '',
              model: data.model ?? request.model,
              tokensUsed: {
                input:
                  data.tokens_used?.input ?? estimateTokens(request.prompt),
                output:
                  data.tokens_used?.output ??
                  estimateTokens(data.response ?? ''),
                total: data.tokens_used?.total ?? 0,
              },
              provider: 'asksage',
            }
          }

          const errorCode = mapHttpStatus(response.status)
          const errorBody = await response.text().catch(() => '')
          lastError = new AIError(
            errorCode,
            `AskSage ${response.status}: ${errorBody}`,
            errorCode === 'RATE_LIMIT' || errorCode === 'TIMEOUT'
          )

          if (!(lastError as AIError).retryable) throw lastError
        } catch (err) {
          if (err instanceof AIError && !err.retryable) throw err
          lastError = err instanceof Error ? err : new Error('Unknown error')

          if (
            err instanceof DOMException &&
            err.name === 'TimeoutError'
          ) {
            lastError = new AIError('TIMEOUT', 'AskSage request timed out', true)
          }
        }

        if (attempt < MAX_RETRIES - 1) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt))
        }
      }

      throw lastError ?? new AIError('UNKNOWN', 'All retries exhausted', false)
    },

    async classify(request: ProviderClassifyRequest): Promise<ProviderClassifyResponse> {
      return classifyContent(request, 'asksage')
    },

    async ping() {
      const start = Date.now()
      try {
        if (!ASKSAGE_API_KEY) {
          return { ok: false, latencyMs: 0 }
        }
        const response = await fetch(`${ASKSAGE_API_URL}/health`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${ASKSAGE_API_KEY}` },
          signal: AbortSignal.timeout(5000),
        })
        return { ok: response.ok, latencyMs: Date.now() - start }
      } catch {
        return { ok: false, latencyMs: Date.now() - start }
      }
    },
  }

  return provider
}
