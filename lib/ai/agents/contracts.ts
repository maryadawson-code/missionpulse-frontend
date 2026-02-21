'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

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

  return aiRequest({
    taskType: 'contracts',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are a government contracts attorney with deep FAR/DFARS expertise. Provide practical, actionable risk assessments. Focus on business impact rather than legal theory.',
  })
}
