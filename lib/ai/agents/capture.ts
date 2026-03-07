'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { CAPTURE_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'
import { runResearch } from '@/lib/ai/research-router'

export async function runCaptureAnalysis(context: {
  title: string
  agency: string
  ceiling: number | null
  description: string
  naicsCode: string | null
  setAside: string | null
  opportunityId: string
}): Promise<AIResponse> {
  // Pre-agent research: fetch live intelligence
  const researchResult = await runResearch({
    query: `${context.title} ${context.agency ?? ''} incumbent contract vehicle recompete`,
    agentType: 'capture',
    opportunityContext: {
      title: context.title,
      agency: context.agency,
      ceiling: context.ceiling ?? undefined,
    },
    isCUI: false,
  })

  const liveIntelSection = researchResult.content
    ? `LIVE INTELLIGENCE (fetched ${new Date().toISOString()}):\n${researchResult.content}\n\nSources: ${researchResult.sources.join(', ')}`
    : null

  const prompt = `Analyze this government contract opportunity and provide a capture analysis:

Title: ${context.title}
Agency: ${context.agency}
Ceiling Value: ${context.ceiling ? `$${context.ceiling.toLocaleString()}` : 'Not specified'}
NAICS: ${context.naicsCode ?? 'Not specified'}
Set-Aside: ${context.setAside ?? 'Full & Open'}

Description: ${context.description}

Please provide:
1. **Probability of Win (pWin)**: Estimate a pWin score (0-100%) with reasoning
2. **Win Themes**: 3-5 key win themes we should emphasize
3. **Risk Factors**: Top 3-5 risk factors that could reduce our chances
4. **Competitive Landscape**: Brief assessment of the likely competitive environment

Format each section clearly with headers.`

  const baseSystemPrompt =
    'You are a senior GovCon capture manager with 20+ years of experience. Provide actionable, specific analysis based on the opportunity details. Be realistic about win probability.'

  const feedbackCtx = await buildFeedbackContext('capture')
  const systemPrompt = [
    baseSystemPrompt,
    liveIntelSection,
    CAPTURE_AGENT_HEALTH_IT_INJECTION,
    feedbackCtx?.instructions,
  ]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'capture',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}
