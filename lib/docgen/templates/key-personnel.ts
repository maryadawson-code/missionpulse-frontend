/**
 * Key Personnel template — maps team assignment data
 * to the KeyPersonnelData structure for DOCX generation.
 */

import type { KeyPersonnelData, KeyPersonnelEntry } from '../docx-engine'

interface PersonnelSource {
  name: string
  role: string
  clearance?: string
  education: string[]
  certifications: string[]
  experience_summary: string
  projects: Array<{
    title: string
    agency: string
    duration: string
    description: string
  }>
}

interface KeyPersonnelSource {
  opportunityTitle: string
  personnel: PersonnelSource[]
}

/**
 * Build KeyPersonnelData from team assignment records.
 */
export function buildKeyPersonnelData(
  source: KeyPersonnelSource
): KeyPersonnelData {
  const personnel: KeyPersonnelEntry[] = source.personnel.map((p) => ({
    name: p.name,
    role: p.role,
    clearance: p.clearance,
    education: p.education,
    certifications: p.certifications,
    experienceSummary: p.experience_summary,
    relevantProjects: p.projects,
  }))

  return {
    opportunityTitle: source.opportunityTitle,
    personnel,
  }
}
