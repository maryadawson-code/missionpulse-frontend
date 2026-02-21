'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

export async function runCaptureAnalysis(context: {
  title: string
  agency: string
  ceiling: number | null
  description: string
  naicsCode: string | null
  setAside: string | null
  opportunityId: string
}): Promise<AIResponse> {
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

  return aiRequest({
    taskType: 'capture',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are a senior GovCon capture manager with 20+ years of experience. Provide actionable, specific analysis based on the opportunity details. Be realistic about win probability.',
  })
}
