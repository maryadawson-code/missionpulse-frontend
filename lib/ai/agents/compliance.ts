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
