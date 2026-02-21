'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

interface CaptureAnalysisResult {
  pwin: number
  winThemes: string[]
  riskFactors: string[]
  competitiveLandscape: string
}

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

export function parseCaptureAnalysis(
  content: string
): CaptureAnalysisResult {
  // Extract pWin (look for percentage)
  const pwinMatch = content.match(/(\d{1,3})%/)
  const pwin = pwinMatch ? parseInt(pwinMatch[1], 10) : 50

  // Extract sections by headers
  const sections = content.split(/\*\*([^*]+)\*\*/)

  const winThemes: string[] = []
  const riskFactors: string[] = []
  let competitiveLandscape = ''
  let currentSection = ''

  for (const section of sections) {
    const trimmed = section.trim().toLowerCase()
    if (trimmed.includes('win theme')) {
      currentSection = 'themes'
    } else if (trimmed.includes('risk')) {
      currentSection = 'risks'
    } else if (trimmed.includes('competitive') || trimmed.includes('landscape')) {
      currentSection = 'landscape'
    } else if (currentSection === 'themes') {
      const items = section
        .split('\n')
        .map((l) => l.replace(/^[\d.)\-*]+\s*/, '').trim())
        .filter((l) => l.length > 10)
      winThemes.push(...items.slice(0, 5))
    } else if (currentSection === 'risks') {
      const items = section
        .split('\n')
        .map((l) => l.replace(/^[\d.)\-*]+\s*/, '').trim())
        .filter((l) => l.length > 10)
      riskFactors.push(...items.slice(0, 5))
    } else if (currentSection === 'landscape') {
      competitiveLandscape = section.trim()
    }
  }

  return {
    pwin: Math.min(100, Math.max(0, pwin)),
    winThemes: winThemes.length > 0 ? winThemes : ['Analysis pending'],
    riskFactors: riskFactors.length > 0 ? riskFactors : ['Analysis pending'],
    competitiveLandscape:
      competitiveLandscape || 'Competitive landscape analysis pending',
  }
}
