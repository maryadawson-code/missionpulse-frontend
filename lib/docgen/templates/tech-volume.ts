/**
 * Technical Volume template — maps AI-generated proposal sections
 * to the TechVolumeData structure for DOCX generation.
 */

import type { TechVolumeData, TechVolumeSection } from '../docx-engine'

interface ProposalSection {
  title: string
  heading_level?: number
  content: string
  is_cui?: boolean
}

interface TechVolumeSource {
  opportunityTitle: string
  solicitationNumber: string
  sections: ProposalSection[]
  isCUI?: boolean
}

/**
 * Build TechVolumeData from proposal sections.
 */
export function buildTechVolumeData(
  source: TechVolumeSource
): TechVolumeData {
  const sections: TechVolumeSection[] = source.sections.map((s) => ({
    heading: s.title,
    level: (s.heading_level ?? 1) as 1 | 2 | 3,
    content: s.content.split('\n\n').filter((p) => p.trim().length > 0),
    cuiPortion: s.is_cui,
  }))

  return {
    opportunityTitle: source.opportunityTitle,
    solicitationNumber: source.solicitationNumber,
    sections,
    isCUI: source.isCUI,
  }
}
