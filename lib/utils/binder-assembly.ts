/**
 * Binder Assembly — one-click proposal binder ZIP generation.
 *
 * Assembles: Tech Volume (.docx), Management Volume (.docx),
 * Cost Volume (.xlsx), Compliance Matrix (.xlsx), Gate Deck (.pptx),
 * and a generated Table of Contents.
 *
 * CUI markings on Pricing and Black Hat artifacts.
 * File naming: [OpportunityTitle]_[Volume]_[Date].ext
 */

import JSZip from 'jszip'
import { generateTechVolume } from '@/lib/docgen/docx-engine'
import type { TechVolumeData } from '@/lib/docgen/docx-engine'
import { generateComplianceMatrix, generateCostModel } from '@/lib/docgen/xlsx-engine'
import type { ComplianceRow, CostModelCLIN } from '@/lib/docgen/xlsx-engine'
import { generateGateDecisionDeck } from '@/lib/docgen/pptx-engine'
import type { GateDecisionData } from '@/lib/docgen/pptx-engine'
import { generateBinderTOC } from '@/lib/docgen/binder-toc'
import type { TOCEntry } from '@/lib/docgen/binder-toc'

// ─── Types ───────────────────────────────────────────────────

export interface BinderInput {
  opportunityTitle: string
  solicitationNumber: string
  techVolume?: TechVolumeData
  managementVolume?: TechVolumeData
  complianceRows?: ComplianceRow[]
  costModelCLINs?: CostModelCLIN[]
  gateDecision?: GateDecisionData
}

// ─── Core ────────────────────────────────────────────────────

/**
 * Assemble a full proposal binder as a ZIP archive.
 * Returns the ZIP as a Buffer.
 */
export async function assembleProposalBinder(
  input: BinderInput
): Promise<Buffer> {
  const zip = new JSZip()
  const date = new Date().toISOString().slice(0, 10)
  const sanitizedTitle = input.opportunityTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50)

  const tocEntries: TOCEntry[] = []

  // Tech Volume
  if (input.techVolume) {
    const filename = `${sanitizedTitle}_Tech_Volume_${date}.docx`
    const buffer = await generateTechVolume(input.techVolume)
    zip.file(filename, buffer)
    tocEntries.push({
      filename,
      volume: 'Technical',
      format: 'docx',
      description: 'Technical approach, solution architecture, and methodology',
      isCUI: input.techVolume.isCUI,
    })
  }

  // Management Volume
  if (input.managementVolume) {
    const filename = `${sanitizedTitle}_Mgmt_Volume_${date}.docx`
    const buffer = await generateTechVolume(input.managementVolume)
    zip.file(filename, buffer)
    tocEntries.push({
      filename,
      volume: 'Management',
      format: 'docx',
      description: 'Management approach, staffing plan, and quality assurance',
    })
  }

  // Compliance Matrix
  if (input.complianceRows && input.complianceRows.length > 0) {
    const filename = `${sanitizedTitle}_Compliance_Matrix_${date}.xlsx`
    const buffer = await generateComplianceMatrix(
      input.complianceRows,
      input.opportunityTitle
    )
    zip.file(filename, buffer)
    tocEntries.push({
      filename,
      volume: 'Compliance',
      format: 'xlsx',
      description: 'Requirement compliance matrix with status tracking',
    })
  }

  // Cost Volume
  if (input.costModelCLINs && input.costModelCLINs.length > 0) {
    const filename = `${sanitizedTitle}_Cost_Volume_${date}.xlsx`
    const buffer = await generateCostModel(
      input.costModelCLINs,
      input.opportunityTitle
    )
    zip.file(filename, buffer)
    tocEntries.push({
      filename,
      volume: 'Cost',
      format: 'xlsx',
      description: 'CLIN pricing, labor categories, and cost model',
      isCUI: true,
    })
  }

  // Gate Decision Deck
  if (input.gateDecision) {
    const filename = `${sanitizedTitle}_Gate_Deck_${date}.pptx`
    const buffer = await generateGateDecisionDeck(input.gateDecision)
    zip.file(filename, Buffer.from(buffer))
    tocEntries.push({
      filename,
      volume: 'Gate Review',
      format: 'pptx',
      description: `Gate ${input.gateDecision.gateNumber} decision deck with metrics and risks`,
    })
  }

  // Table of Contents (always included)
  if (tocEntries.length > 0) {
    const tocFilename = `${sanitizedTitle}_TOC_${date}.docx`
    const tocBuffer = await generateBinderTOC(
      tocEntries,
      input.opportunityTitle,
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
    zip.file(tocFilename, tocBuffer)
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return zipBuffer
}
