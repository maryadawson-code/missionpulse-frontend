'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'
import { COMPLIANCE_AGENT_HEALTH_IT_INJECTION } from '@/lib/agents/health-it-domain-config'
import { runResearch } from '@/lib/ai/research-router'

export async function runComplianceExtraction(context: {
  sourceText: string
  opportunityId: string
}): Promise<AIResponse> {
  // Published solicitation text is not CUI — it's a publicly available government document.
  const researchResult = await runResearch({
    query: context.sourceText.slice(0, 500),
    agentType: 'compliance',
    isCUI: false,
  })

  const liveIntelSection = researchResult.content
    ? `LIVE INTELLIGENCE (fetched ${new Date().toISOString()}):\n${researchResult.content}\n\nSources: ${researchResult.sources.join(', ')}`
    : null

  const prompt = `Analyze the following RFP/solicitation text and extract all compliance requirements.

For each requirement found, provide:
1. **Reference**: A unique identifier (e.g., REQ-001)
2. **Requirement**: The full requirement text
3. **Section**: Which proposal section it belongs to (Technical, Management, Past Performance, Cost, Other)
4. **Priority**: Critical, High, Medium, or Low
5. **Confidence**: How confident you are this is a genuine compliance requirement (high, medium, low)
6. **Because**: Brief explanation of why this is a requirement

Focus on:
- SHALL/MUST/WILL/REQUIRED/MANDATORY statements
- Evaluation criteria and scoring factors
- Submittal requirements
- Page/format/content requirements
- Certification requirements

Source text:
${context.sourceText.slice(0, 8000)}
${liveIntelSection ? '\nCross-reference any vehicle or framework mentions against the live intelligence above.' : ''}
Format as a numbered list with clear delimiters for each field.`

  const baseSystemPrompt =
    'You are an expert GovCon compliance analyst. Extract every compliance requirement from RFP text. Be thorough — missing a requirement can be grounds for elimination. Err on the side of including marginal requirements with lower confidence.'

  const feedbackCtx = await buildFeedbackContext('compliance')
  const systemPrompt = [baseSystemPrompt, liveIntelSection, COMPLIANCE_AGENT_HEALTH_IT_INJECTION, feedbackCtx?.instructions]
    .filter(Boolean)
    .join('\n\n')

  return aiRequest({
    taskType: 'compliance',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt,
    // RFP/solicitation text is from published government sources — not CUI.
    // Skip content scanner to avoid false OPSEC classification from terms
    // like "TS/SCI", "FOUO", etc. that appear in public solicitations.
    classificationOverride: 'UNCLASSIFIED',
  })
}
