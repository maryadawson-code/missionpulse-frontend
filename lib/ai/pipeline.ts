/**
 * AI Request/Response Pipeline — single entry point for all AI operations.
 * token-gate → classify → select model → execute → debit → log → return typed response.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { AIRequestOptions, AIResponse } from './types'
import { AIError } from './types'
import { classifyRequest } from './classification-router'
import { selectModel } from './model-selector'
import { routedQuery } from './router'
import { logTokenUsage } from './logger'
import { getCachedResponse, setCachedResponse } from '@/lib/cache/semantic-cache'
import { checkTokenGate, recordTokenUsage } from '@/lib/billing/token-gate'
import { resolveRole, getAllowedAgents } from '@/lib/rbac/config'

/**
 * Unified AI request function. All AI calls go through this.
 * Handles token gate, classification, model selection, execution, debit, logging.
 * Returns graceful fallback if AI fails (feature works without AI).
 */
export async function aiRequest(
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now()

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AIError('AUTH_ERROR', 'Not authenticated')
  }

  // Resolve profile for token gate + agent access
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id

  // Agent Access Gate: Enforce role-based allowedAgents
  const agentType = options.taskType
  // 'chat', 'summarize', 'classify' are utility tasks — not gated
  const UNGATED_TASKS = ['chat', 'summarize', 'classify']
  if (!UNGATED_TASKS.includes(agentType)) {
    const role = resolveRole(profile?.role)
    const allowed = getAllowedAgents(role)
    if (!allowed.includes(agentType)) {
      throw new AIError(
        'AUTH_ERROR',
        `Your role does not have access to the ${agentType} agent.`
      )
    }
  }

  // Token Gate: Pre-flight check
  if (companyId) {
    const gate = await checkTokenGate(companyId, options.opportunityId)
    if (!gate.allowed) {
      return {
        content: gate.message ?? 'Monthly AI token limit reached.',
        model_used: 'none',
        engine: 'asksage',
        confidence: 'low',
        citations: [],
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: Date.now() - startTime,
        classification: 'UNCLASSIFIED',
      }
    }
  }

  try {
    // Step 1: Classify the request
    const classification = await classifyRequest(
      options.prompt,
      options.context
    )

    // Step 2: Select model
    const modelSelection = await selectModel(
      options.taskType,
      classification.level
    )

    // Step 3: Check cache
    const cacheInput = {
      prompt: options.prompt,
      model: modelSelection.primary.model,
      classification: classification.level,
      taskType: options.taskType,
      systemPrompt: options.systemPrompt,
    }

    const cached = await getCachedResponse(cacheInput)
    if (cached) {
      const latencyMs = Date.now() - startTime
      return {
        content: cached.content,
        model_used: cached.model_used,
        engine: modelSelection.primary.engine,
        confidence: cached.confidence,
        citations: [],
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: latencyMs,
        classification: classification.level,
      }
    }

    // Step 4: Execute via provider router (classification-aware failover)
    const response = await routedQuery(
      {
        model: modelSelection.primary.model,
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens ?? modelSelection.primary.maxTokens,
        temperature: options.temperature ?? modelSelection.primary.temperature,
        context: options.context,
      },
      classification.level
    )

    const latencyMs = Date.now() - startTime
    const confidence = inferConfidence(response.content)

    // Step 5: Store in cache
    await setCachedResponse(cacheInput, {
      content: response.content,
      model_used: response.model,
      confidence,
    })

    // Step 6: Log usage
    const costEstimate =
      ((response.tokensUsed.input + response.tokensUsed.output) / 1000) *
      modelSelection.primary.estimatedCostPer1k

    await logTokenUsage({
      agent_id: options.taskType,
      input_tokens: response.tokensUsed.input,
      output_tokens: response.tokensUsed.output,
      estimated_cost_usd: costEstimate,
      user_id: user.id,
      opportunity_id: options.opportunityId,
      metadata: {
        model: response.model,
        provider: response.provider,
        classification: classification.level,
        latency_ms: latencyMs,
        cache_hit: false,
      },
    })

    // Step 7: Token Gate — Post-response debit
    if (companyId) {
      await recordTokenUsage(
        companyId,
        response.tokensUsed.input + response.tokensUsed.output
      )
    }

    // Step 8: Return typed response
    return {
      content: response.content,
      model_used: response.model,
      engine: modelSelection.primary.engine,
      confidence,
      citations: [],
      tokens_in: response.tokensUsed.input,
      tokens_out: response.tokensUsed.output,
      latency_ms: latencyMs,
      classification: classification.level,
    }
  } catch (err) {
    const latencyMs = Date.now() - startTime

    // Graceful fallback — feature works without AI
    if (err instanceof AIError) {
      console.error(`[ai-pipeline] ${err.code}: ${err.message}`)
    } else {
      console.error('[ai-pipeline] Unexpected error:', err)
    }

    return {
      content:
        'AI processing is currently unavailable. Please try again later or complete this task manually.',
      model_used: 'none',
      engine: 'asksage',
      confidence: 'low',
      citations: [],
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: latencyMs,
      classification: 'UNCLASSIFIED',
    }
  }
}

/**
 * Simple confidence inference based on response length and content.
 */
function inferConfidence(
  response: string
): 'high' | 'medium' | 'low' {
  if (response.length < 50) return 'low'
  if (response.includes('I am not sure') || response.includes('unclear'))
    return 'low'
  if (response.length > 500) return 'high'
  return 'medium'
}
