'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

export async function runComplianceExtraction(context: {
  sourceText: string
  opportunityId: string
}): Promise<AIResponse> {
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

Format as a numbered list with clear delimiters for each field.`

  return aiRequest({
    taskType: 'compliance',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are an expert GovCon compliance analyst. Extract every compliance requirement from RFP text. Be thorough — missing a requirement can be grounds for elimination. Err on the side of including marginal requirements with lower confidence.',
  })
}

export interface ExtractedRequirement {
  reference: string
  requirement: string
  section: string
  priority: string
  confidence: 'high' | 'medium' | 'low'
  because: string
}

export function parseExtractedRequirements(
  content: string
): ExtractedRequirement[] {
  const requirements: ExtractedRequirement[] = []

  // Split by numbered items or REQ- patterns
  const blocks = content.split(/(?=\d+\.\s|\bREQ-\d+)/)

  for (const block of blocks) {
    if (block.trim().length < 20) continue

    const refMatch = block.match(/REQ-(\d+)|(\d+)\./)?.[0] ?? ''
    const reference =
      refMatch.startsWith('REQ') ? refMatch : `REQ-${String(requirements.length + 1).padStart(3, '0')}`

    // Extract fields
    const reqMatch = block.match(
      /\*\*Requirement\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const sectionMatch = block.match(
      /\*\*Section\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const priorityMatch = block.match(
      /\*\*Priority\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const confMatch = block.match(
      /\*\*Confidence\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const becauseMatch = block.match(
      /\*\*Because\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )

    const requirementText =
      reqMatch?.[1]?.trim() ?? block.replace(/^[\d.\s]+/, '').trim().slice(0, 300)
    if (requirementText.length < 10) continue

    const priorityRaw = priorityMatch?.[1]?.trim() ?? 'Medium'
    const confRaw = confMatch?.[1]?.trim().toLowerCase() ?? 'medium'

    requirements.push({
      reference,
      requirement: requirementText,
      section: sectionMatch?.[1]?.trim() ?? 'Other',
      priority: ['Critical', 'High', 'Medium', 'Low'].includes(priorityRaw)
        ? priorityRaw
        : 'Medium',
      confidence: confRaw.includes('high')
        ? 'high'
        : confRaw.includes('low')
          ? 'low'
          : 'medium',
      because:
        becauseMatch?.[1]?.trim() ??
        'Identified as a compliance requirement based on solicitation language.',
    })
  }

  return requirements
}
