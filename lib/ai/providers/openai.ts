/**
 * OpenAI Provider — GPT models via direct API.
 * Fallback for UNCLASSIFIED work only. NOT FedRAMP authorized.
 */
'use server'

import { AIError } from '../types'
import { classifyContent } from './classify-shared'
import type {
  AIProvider,
  ProviderQueryRequest,
  ProviderQueryResponse,
  ProviderClassifyRequest,
  ProviderClassifyResponse,
} from './interface'

// ─── Config ──────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1'

// Read the API key at call time — NOT at module load time.
function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

const MAX_RETRIES = 2
const BASE_DELAY_MS = 1000

// ─── Helpers ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ─── Provider Implementation ────────────────────────────────

export async function createOpenAIProvider(): Promise<AIProvider> {
  const provider: AIProvider = {
    id: 'openai',
    name: 'OpenAI (GPT)',
    isFedRAMPAuthorized: false,

    isConfigured() {
      return Boolean(getOpenAIKey())
    },

    async query(request: ProviderQueryRequest): Promise<ProviderQueryResponse> {
      if (!getOpenAIKey()) {
        throw new AIError(
          'AUTH_ERROR',
          'OpenAI API key not configured',
          false
        )
      }

      let lastError: Error | null = null

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const messages: Array<{ role: string; content: string }> = []

          if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt })
          }

          const userContent = request.context
            ? `Context:\n${request.context}\n\n${request.prompt}`
            : request.prompt

          messages.push({ role: 'user', content: userContent })

          const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getOpenAIKey()}`,
            },
            body: JSON.stringify({
              model: request.model,
              messages,
              max_tokens: request.maxTokens ?? 2048,
              temperature: request.temperature ?? 0.7,
            }),
            signal: AbortSignal.timeout(60000),
          })

          if (response.ok) {
            const data = await response.json()
            const textContent =
              data.choices?.[0]?.message?.content ?? ''

            return {
              content: textContent,
              model: data.model ?? request.model,
              tokensUsed: {
                input:
                  data.usage?.prompt_tokens ?? estimateTokens(request.prompt),
                output:
                  data.usage?.completion_tokens ??
                  estimateTokens(textContent),
                total: data.usage?.total_tokens ?? 0,
              },
              provider: 'openai',
            }
          }

          const errorBody = await response.text().catch(() => '')
          const retryable = response.status === 429 || response.status >= 500
          lastError = new AIError(
            response.status === 429
              ? 'RATE_LIMIT'
              : response.status === 401
                ? 'AUTH_ERROR'
                : 'UNKNOWN',
            `OpenAI ${response.status}: ${errorBody}`,
            retryable
          )

          if (!retryable) throw lastError
        } catch (err) {
          if (err instanceof AIError && !err.retryable) throw err
          lastError = err instanceof Error ? err : new Error('Unknown error')
        }

        if (attempt < MAX_RETRIES - 1) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt))
        }
      }

      throw lastError ?? new AIError('UNKNOWN', 'All retries exhausted', false)
    },

    async classify(request: ProviderClassifyRequest): Promise<ProviderClassifyResponse> {
      return classifyContent(request, 'openai')
    },

    async ping() {
      const start = Date.now()
      try {
        if (!getOpenAIKey()) {
          return { ok: false, latencyMs: 0 }
        }
        const response = await fetch(`${OPENAI_API_URL}/models`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${getOpenAIKey()}` },
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
