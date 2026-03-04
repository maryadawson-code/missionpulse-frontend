'use server'

import { createClient } from '@/lib/supabase/server'
import { aiRequest } from '@/lib/ai/pipeline'
import { tryCompleteOnboardingStep } from '@/lib/billing/onboarding-hooks'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'

interface ChatResult {
  success: boolean
  response?: string
  model?: string
  confidence?: 'high' | 'medium' | 'low'
  messageId?: string
  error?: string
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  general: 'You are MissionPulse AI, a GovCon proposal assistant. Help the user with pipeline management, compliance, proposal writing, pricing strategy, and government contracting best practices.',
  capture: 'You are the Capture Agent specializing in opportunity analysis, pWin scoring, win theme development, and competitive landscape assessment for government contracting.',
  writer: 'You are the Writer Agent specializing in proposal section drafting, compliance-mapped content, and persuasive government proposal writing using Shipley methodology.',
  compliance: 'You are the Compliance Agent specializing in RFP requirements extraction, SHALL/MUST analysis, compliance matrix validation, and regulatory cross-referencing.',
  pricing: 'You are the Pricing Agent specializing in BOE generation, labor category analysis, wrap rate calculations, and price-to-win modeling for government contracts.',
  strategy: 'You are the Strategy Agent specializing in discriminator development, Section M alignment, win theme strategy, and competitive positioning.',
  blackhat: 'You are the Black Hat Agent specializing in competitor analysis, ghost strategy development, counter-tactics, and competitive intelligence assessment.',
  contracts: 'You are the Contracts Agent specializing in FAR/DFARS clause analysis, T&C risk assessment, and contract compliance review.',
  orals: 'You are the Orals Coach Agent specializing in oral presentation preparation, evaluator Q&A generation, and speaker coaching for government proposal orals.',
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  opportunityContext?: string,
  agentType?: string
): Promise<ChatResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Store user message + fetch feedback context in parallel (zero added latency)
  const [, feedbackCtx] = await Promise.all([
    supabase.from('chat_messages').insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: 'user',
      content: message,
    }),
    buildFeedbackContext(agentType ?? 'general'),
  ])

  // Build context-aware system prompt based on selected agent
  const basePrompt = AGENT_SYSTEM_PROMPTS[agentType ?? 'general'] ?? AGENT_SYSTEM_PROMPTS.general
  let systemPrompt = opportunityContext
    ? `${basePrompt}\n\nThe user is currently viewing an opportunity. Here is the context:\n\n${opportunityContext}\n\nHelp the user with their question about this opportunity.`
    : basePrompt

  // Append self-learning feedback context if available
  if (feedbackCtx) {
    systemPrompt = `${systemPrompt}\n\n${feedbackCtx.instructions}`
  }

  // Run through AI pipeline
  const aiResponse = await aiRequest({
    taskType: 'chat',
    prompt: message,
    systemPrompt,
    context: opportunityContext,
  })

  // Store assistant message
  const assistantMessageId = crypto.randomUUID()
  await supabase.from('chat_messages').insert({
    id: assistantMessageId,
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse.content,
    tokens_used: aiResponse.tokens_in + aiResponse.tokens_out,
  })

  // Update session timestamp
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Pilot onboarding hook
  tryCompleteOnboardingStep('run_ai_agent')

  return {
    success: true,
    response: aiResponse.content,
    model: aiResponse.model_used,
    confidence: aiResponse.confidence as 'high' | 'medium' | 'low',
    messageId: assistantMessageId,
  }
}

export async function createChatSession(
  opportunityId?: string,
  agentType?: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const sessionId = crypto.randomUUID()

  const { error } = await supabase.from('chat_sessions').insert({
    id: sessionId,
    user_id: user.id,
    agent_type: agentType ?? 'general',
    opportunity_id: opportunityId ?? null,
  })

  if (error) return { success: false, error: error.message }

  return { success: true, sessionId }
}
