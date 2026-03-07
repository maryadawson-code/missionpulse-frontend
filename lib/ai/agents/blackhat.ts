'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { BLACK_HAT_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'
import { runResearch } from '@/lib/ai/research-router'

export async function runBlackHatAgent(context: {
  opportunityTitle: string
  agency: string
  description: string
  competitorName: string
  competitorStrengths: string[]
  competitorWeaknesses: string[]
  opportunityId: string
}): Promise<AIResponse> {
  // Research query uses ONLY public data (competitor name + agency + opportunity title).
  // NOT the CUI-marked competitive analysis output.
  const researchResult = await runResearch({
    query: `${context.competitorName} federal contracts ${context.agency ?? ''} past performance awards`,
    agentType: 'blackhat',
    opportunityContext: {
      title: context.opportunityTitle,
      agency: context.agency,
    },
    isCUI: false,
  })

  const liveIntelSection = researchResult.content
    ? `LIVE INTELLIGENCE (fetched ${new Date().toISOString()}):\n${researchResult.content}\n\nSources: ${researchResult.sources.join(', ')}`
    : null

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

  const baseSystemPrompt =
    'You are a senior GovCon capture strategist conducting a Black Hat review. Think like the competitor — what would their proposal look like? Provide specific, actionable intelligence, not generic observations. All output is CUI//OPSEC.'

  const feedbackCtx = await buildFeedbackContext('blackhat')
  const systemPrompt = [baseSystemPrompt, liveIntelSection, BLACK_HAT_AGENT_HEALTH_IT_INJECTION, feedbackCtx?.instructions]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
  })
}

export async function runMultiCompetitorBlackHat(context: {
  opportunityTitle: string
  agency: string
  description: string
  competitors: { name: string; strengths: string[]; weaknesses: string[] }[]
  opportunityId: string
}): Promise<AIResponse> {
  // Research query: competitor names are public data
  const competitorNames = context.competitors.map((c) => c.name).join(' OR ')
  const multiResearchResult = await runResearch({
    query: `${competitorNames} federal health IT contracts competition`,
    agentType: 'blackhat',
    opportunityContext: {
      title: context.opportunityTitle,
      agency: context.agency,
    },
    isCUI: false,
  })

  const multiLiveIntelSection = multiResearchResult.content
    ? `LIVE INTELLIGENCE (fetched ${new Date().toISOString()}):\n${multiResearchResult.content}\n\nSources: ${multiResearchResult.sources.join(', ')}`
    : null

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

  const multiBasePrompt =
    'You are a senior GovCon capture strategist conducting a multi-competitor Black Hat review. Analyze the competitive field holistically. Focus on exploitable gaps and realistic counter-strategies. All output is CUI//OPSEC.'

  const multiFeedbackCtx = await buildFeedbackContext('blackhat')
  const multiSystemPrompt = [multiBasePrompt, multiLiveIntelSection, BLACK_HAT_AGENT_HEALTH_IT_INJECTION, multiFeedbackCtx?.instructions]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'strategy',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt: multiSystemPrompt,
  })
}
