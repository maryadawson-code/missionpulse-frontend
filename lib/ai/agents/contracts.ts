'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { COMPLIANCE_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'

export async function runContractsAgent(context: {
  clauses: { id: string; clause_number: string; clause_title: string; full_text: string }[]
  opportunityId: string
}): Promise<AIResponse> {
  const clauseList = context.clauses
    .map(
      (c) =>
        `Clause ${c.clause_number}: ${c.clause_title}\n${c.full_text?.slice(0, 500) ?? 'No text'}`
    )
    .join('\n\n---\n\n')

  const prompt = `Analyze these FAR/DFARS contract clauses and provide risk assessments:

${clauseList}

For each clause, provide:
1. **Risk Level**: High, Medium, or Low
2. **Risk Assessment**: Plain-language explanation of what this clause means for us
3. **Negotiation Recommendation**: Whether this is negotiable and recommended approach
4. **Because**: Why this risk level was assigned

Format each clause analysis clearly.`

  const baseSystemPrompt =
    'You are a government contracts attorney with deep FAR/DFARS expertise. Provide practical, actionable risk assessments. Focus on business impact rather than legal theory.'

  const feedbackCtx = await buildFeedbackContext('contracts')
  const systemPrompt = [baseSystemPrompt, COMPLIANCE_AGENT_HEALTH_IT_INJECTION, feedbackCtx?.instructions]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'contracts',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}
