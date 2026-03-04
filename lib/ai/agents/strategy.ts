'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'

export async function runStrategyAgent(context: {
  title: string
  agency: string
  description: string
  setAside: string | null
  naicsCode: string | null
  opportunityId: string
}): Promise<AIResponse> {
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
  const systemPrompt = feedbackCtx
    ? `${baseSystemPrompt}\n\n${feedbackCtx.instructions}`
    : baseSystemPrompt

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}
