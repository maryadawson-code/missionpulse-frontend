'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

export async function runPricingAgent(context: {
  title: string
  agency: string
  description: string
  naicsCode: string | null
  ceiling: number | null
  requirements: string[]
  existingLCATs: string[]
  opportunityId: string
}): Promise<AIResponse> {
  const reqList = context.requirements
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n')

  const lcatList =
    context.existingLCATs.length > 0
      ? `\n\nExisting LCATs already defined:\n${context.existingLCATs.join(', ')}`
      : ''

  const prompt = `Generate pricing recommendations for this government contract opportunity:

Title: ${context.title}
Agency: ${context.agency}
NAICS: ${context.naicsCode ?? 'Not specified'}
Ceiling: ${context.ceiling ? `$${context.ceiling.toLocaleString()}` : 'Not specified'}
Description: ${context.description}

Key Requirements:
${reqList || 'No specific requirements listed'}
${lcatList}

Please provide:
1. **Recommended LCATs**: Labor categories needed with suggested levels, typical hourly rates for ${context.agency}, and headcount estimates
2. **BOE Framework**: Basis of Estimate structure — how to justify proposed staffing levels and hours
3. **Price-to-Win Analysis**: Market benchmarks, competitor rate ranges, recommended pricing strategy (aggressive/moderate/conservative)
4. **Margin Scenarios**: Three pricing scenarios with different margin targets and their implications
5. **Wrap Rate Guidance**: Recommended fringe, overhead, G&A, and fee percentages for this contract type

For each recommendation, include a "Because" explaining the reasoning.

IMPORTANT: This analysis contains CUI//SP-PROPIN data. All pricing information is proprietary.`

  return aiRequest({
    taskType: 'pricing',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are a GovCon pricing strategist with deep expertise in government cost proposals. Provide specific rate recommendations based on agency, NAICS, and market data. Focus on realistic, competitive pricing that maximizes win probability while maintaining acceptable margins. All output is CUI//SP-PROPIN.',
  })
}
