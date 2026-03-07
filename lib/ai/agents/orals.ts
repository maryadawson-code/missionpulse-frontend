'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { ORALS_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'

export async function runOralsAgent(context: {
  title: string
  agency: string
  description: string
  requirements: string[]
  opportunityId: string
}): Promise<AIResponse> {
  const reqList = context.requirements
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n')

  const prompt = `Generate oral presentation preparation materials for this government contract opportunity:

Title: ${context.title}
Agency: ${context.agency}
Description: ${context.description}

Key Requirements:
${reqList || 'No specific requirements listed'}

Please generate:
1. **15+ Evaluator-Style Questions**: Questions that a government evaluation panel would likely ask, ranging from technical to management to past performance
2. **Suggested Answers**: For each question, a strong answer framework
3. **Coaching Tips**: Specific coaching advice for each question
4. **Speaker Notes**: Key talking points for the opening and closing

For each Q&A pair, include a "Because" explaining why an evaluator would ask this question.`

  const baseSystemPrompt =
    'You are an experienced government source evaluation board member and orals coach. Generate realistic, challenging questions that evaluators actually ask. Provide practical coaching tips, not generic presentation advice.'

  const feedbackCtx = await buildFeedbackContext('orals')
  const systemPrompt = [baseSystemPrompt, ORALS_AGENT_HEALTH_IT_INJECTION, feedbackCtx?.instructions]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'orals',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}
