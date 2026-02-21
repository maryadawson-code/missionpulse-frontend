/**
 * Anthropic Provider — Claude models via direct API.
 * Fallback for UNCLASSIFIED work only. NOT FedRAMP authorized.
 */
'use server'

import { AIError } from '../types'
import type {
  AIProvider,
  ProviderQueryRequest,
  ProviderQueryResponse,
} from './interface'

// ─── Config ──────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1'

const MAX_RETRIES = 2
const BASE_DELAY_MS = 1000

// ─── Helpers ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ─── Model Mapping ──────────────────────────────────────────
// Map generic model names to Anthropic model IDs

function resolveAnthropicModel(model: string): string {
  const modelMap: Record<string, string> = {
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
    'claude-sonnet-4-5': 'claude-sonnet-4-5-20250514',
    'claude-opus-4': 'claude-opus-4-20250514',
  }
  return modelMap[model] ?? model
}

// ─── Provider Implementation ────────────────────────────────

export async function createAnthropicProvider(): Promise<AIProvider> {
  const provider: AIProvider = {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    isFedRAMPAuthorized: false,

    isConfigured() {
      return Boolean(ANTHROPIC_API_KEY)
    },

    async query(request: ProviderQueryRequest): Promise<ProviderQueryResponse> {
      if (!ANTHROPIC_API_KEY) {
        throw new AIError(
          'AUTH_ERROR',
          'Anthropic API key not configured',
          false
        )
      }

      const anthropicModel = resolveAnthropicModel(request.model)
      let lastError: Error | null = null

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: anthropicModel,
              max_tokens: request.maxTokens ?? 2048,
              temperature: request.temperature ?? 0.7,
              system: request.systemPrompt ?? undefined,
              messages: [
                {
                  role: 'user',
                  content: request.context
                    ? `Context:\n${request.context}\n\n${request.prompt}`
                    : request.prompt,
                },
              ],
            }),
            signal: AbortSignal.timeout(60000),
          })

          if (response.ok) {
            const data = await response.json()
            const textContent =
              data.content
                ?.filter((b: { type: string }) => b.type === 'text')
                .map((b: { text: string }) => b.text)
                .join('') ?? ''

            return {
              content: textContent,
              model: data.model ?? anthropicModel,
              tokensUsed: {
                input: data.usage?.input_tokens ?? estimateTokens(request.prompt),
                output: data.usage?.output_tokens ?? estimateTokens(textContent),
                total:
                  (data.usage?.input_tokens ?? 0) +
                  (data.usage?.output_tokens ?? 0),
              },
              provider: 'anthropic',
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
            `Anthropic ${response.status}: ${errorBody}`,
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

    async ping() {
      const start = Date.now()
      try {
        if (!ANTHROPIC_API_KEY) {
          return { ok: false, latencyMs: 0 }
        }
        // Anthropic doesn't have a health endpoint — send minimal request
        const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
          signal: AbortSignal.timeout(10000),
        })
        return { ok: response.ok, latencyMs: Date.now() - start }
      } catch {
        return { ok: false, latencyMs: Date.now() - start }
      }
    },
  }

  return provider
}
