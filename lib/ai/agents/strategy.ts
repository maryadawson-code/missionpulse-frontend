'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { STRATEGY_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'
import { runResearch } from '@/lib/ai/research-router'

export async function runStrategyAgent(context: {
  title: string
  agency: string
  description: string
  setAside: string | null
  naicsCode: string | null
  opportunityId: string
}): Promise<AIResponse> {
  // Pre-agent research: fetch competitive landscape intelligence
  const researchResult = await runResearch({
    query: `${context.title} ${context.agency ?? ''} competitor competition budget recompete`,
    agentType: 'strategy',
    opportunityContext: {
      title: context.title,
      agency: context.agency,
    },
    isCUI: false,
  })

  const liveIntelSection = researchResult.content
    ? `LIVE INTELLIGENCE (fetched ${new Date().toISOString()}):\n${researchResult.content}\n\nSources: ${researchResult.sources.join(', ')}`
    : null

  const prompt = `Generate a capture strategy for this government opportunity:

Title: ${context.title}
Agency: ${context.agency}
NAICS: ${context.naicsCode ?? 'Not specified'}
Set-Aside: ${context.setAside ?? 'Full & Open'}
Description: ${context.description}

Provide:
1. **Discriminators**: 3-5 unique value propositions that differentiate us
2. **Win Themes**: 3-5 compelling themes aligned with evaluation criteria
3. **Section M Alignment**: How to map our solution to likely evaluation factors
4. **Competitor Positioning**: How to position against likely competitors

For each item, include a brief "Because" explanation.`

  const baseSystemPrompt =
    'You are a GovCon strategy consultant specializing in Shipley methodology. Generate specific, actionable strategy recommendations. Avoid generic advice — tie everything to the specific opportunity details provided.'

  const feedbackCtx = await buildFeedbackContext('strategy')
  const systemPrompt = [
    baseSystemPrompt,
    liveIntelSection,
    STRATEGY_AGENT_HEALTH_IT_INJECTION,
    feedbackCtx?.instructions,
  ]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}
