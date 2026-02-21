'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

export async function runBlackHatAgent(context: {
  opportunityTitle: string
  agency: string
  description: string
  competitorName: string
  competitorStrengths: string[]
  competitorWeaknesses: string[]
  opportunityId: string
}): Promise<AIResponse> {
  const strengths = context.competitorStrengths.length > 0
    ? context.competitorStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : 'No known strengths'

  const weaknesses = context.competitorWeaknesses.length > 0
    ? context.competitorWeaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')
    : 'No known weaknesses'

  const prompt = `Conduct a Black Hat review for competitor "${context.competitorName}" on this opportunity:

Opportunity: ${context.opportunityTitle}
Agency: ${context.agency}
Description: ${context.description}

Known Strengths of ${context.competitorName}:
${strengths}

Known Weaknesses of ${context.competitorName}:
${weaknesses}

Please provide:
1. **Ghost Strategy**: What would ${context.competitorName} likely propose? Their approach, team structure, pricing strategy, and key themes.
2. **Ghost Win Themes**: 3-5 themes ${context.competitorName} would use to differentiate themselves.
3. **Vulnerability Analysis**: Specific weaknesses we can exploit in our proposal.
4. **Counter-Tactics**: For each ghost theme, provide a counter-tactic that neutralizes their advantage.
5. **Discriminators to Emphasize**: What we should highlight to contrast against this competitor.

For each item, include a "Because" explanation.

IMPORTANT: This analysis contains CUI//OPSEC data. All competitive intelligence is operations security.`

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are a senior GovCon capture strategist conducting a Black Hat review. Think like the competitor — what would their proposal look like? Provide specific, actionable intelligence, not generic observations. All output is CUI//OPSEC.',
  })
}

export async function runMultiCompetitorBlackHat(context: {
  opportunityTitle: string
  agency: string
  description: string
  competitors: { name: string; strengths: string[]; weaknesses: string[] }[]
  opportunityId: string
}): Promise<AIResponse> {
  const competitorProfiles = context.competitors
    .map(
      (c) =>
        `**${c.name}**\nStrengths: ${c.strengths.join(', ') || 'Unknown'}\nWeaknesses: ${c.weaknesses.join(', ') || 'Unknown'}`
    )
    .join('\n\n')

  const prompt = `Conduct a comprehensive Black Hat review for this opportunity against multiple competitors:

Opportunity: ${context.opportunityTitle}
Agency: ${context.agency}
Description: ${context.description}

COMPETITOR PROFILES:
${competitorProfiles}

Please provide:
1. **Competitive Landscape Summary**: Who is the strongest threat and why?
2. **Per-Competitor Ghost Strategy**: Brief ghost proposal outline for each competitor.
3. **Cross-Competitor Vulnerabilities**: Common weaknesses across competitors we can exploit.
4. **Recommended Counter-Strategy**: Our overall approach to position against all competitors simultaneously.
5. **Key Discriminators**: What differentiates us from the entire field?

For each major recommendation, include a "Because" explanation.

IMPORTANT: CUI//OPSEC data.`

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are a senior GovCon capture strategist conducting a multi-competitor Black Hat review. Analyze the competitive field holistically. Focus on exploitable gaps and realistic counter-strategies. All output is CUI//OPSEC.',
  })
}
