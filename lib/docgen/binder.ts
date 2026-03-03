/**
 * Binder Assembler — packages all proposal volumes into a ZIP archive.
 *
 * Generates Tech Volume (.docx), Compliance Matrix (.xlsx), Cost Model (.xlsx),
 * Gate Decision deck (.pptx), and a master TOC (.docx).
 * CUI banners on pricing and black hat artifacts.
 */
'use server'

import archiver from 'archiver'
import { createClient } from '@/lib/supabase/server'
import { generateTechVolume } from './docx-engine'
import { generateComplianceMatrix, generateCostModel } from './xlsx-engine'
import { generateGateDecisionDeck } from './pptx-engine'
import { generateBinderTOC, type TOCEntry } from './binder-toc'
import { buildTechVolumeData } from './templates/tech-volume'
import { buildComplianceRows } from './templates/compliance-matrix'
import { buildCostModelCLINs } from './templates/cost-model'
import { buildGateDecisionData } from './templates/gate-decision'

// ─── Types ───────────────────────────────────────────────────

export interface BinderResult {
  buffer: Buffer
  filename: string
  fileCount: number
}

// ─── Assembler ───────────────────────────────────────────────

/**
 * Assemble a complete proposal binder for an opportunity.
 * Returns a ZIP buffer containing all generated documents + TOC.
 */
export async function assembleBinder(
  opportunityId: string
): Promise<BinderResult> {
  const supabase = await createClient()

  // Fetch opportunity
  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title, agency, ceiling, pwin, phase, company_id, status, solicitation_number')
    .eq('id', opportunityId)
    .single()

  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`)

  const title = (opp.title as string) ?? 'Untitled'
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  const dateStr = new Date().toISOString().split('T')[0]
  // Fetch related data
  const [
    { data: sections },
    { data: complianceReqs },
    { data: teamMembers },
  ] = await Promise.all([
    supabase
      .from('proposal_sections')
      .select('id, section_title, content, section_number, status')
      .eq('opportunity_id', opportunityId)
      .order('section_number'),
    supabase
      .from('compliance_requirements')
      .select('id, reference, requirement, section, priority, status')
      .eq('opportunity_id', opportunityId),
    supabase
      .from('opportunity_assignments')
      .select('assignee_name, role')
      .eq('opportunity_id', opportunityId),
  ])

  // Build file list and TOC entries
  const tocEntries: TOCEntry[] = []
  const files: Array<{ name: string; buffer: Buffer | Uint8Array }> = []

  // 1. Tech Volume
  const solicitationNumber = (opp.solicitation_number as string) ?? ''
  const techData = buildTechVolumeData({
    opportunityTitle: title,
    solicitationNumber,
    sections: (sections ?? []).map((s) => ({
      title: (s.section_title as string) ?? '',
      content: (s.content as string) ?? '',
    })),
  })
  const techBuffer = await generateTechVolume(techData)
  const techFilename = `${safeTitle}_Technical_Volume_${dateStr}.docx`
  files.push({ name: techFilename, buffer: techBuffer })
  tocEntries.push({
    filename: techFilename,
    volume: 'Technical',
    format: 'docx',
    description: 'Technical approach and methodology',
  })

  // 2. Compliance Matrix
  const complianceRows = buildComplianceRows(
    (complianceReqs ?? []).map((r) => ({
      reference: r.reference ?? null,
      requirement: r.requirement ?? null,
      section: r.section ?? null,
      priority: r.priority ?? null,
      status: r.status ?? 'Not Addressed',
    }))
  )
  const complianceBuffer = await generateComplianceMatrix(complianceRows, title)
  const complianceFilename = `${safeTitle}_Compliance_Matrix_${dateStr}.xlsx`
  files.push({ name: complianceFilename, buffer: complianceBuffer })
  tocEntries.push({
    filename: complianceFilename,
    volume: 'Compliance',
    format: 'xlsx',
    description: 'Requirements traceability matrix',
  })

  // 3. Cost Model
  const costCLINs = buildCostModelCLINs([])
  const costBuffer = await generateCostModel(costCLINs, title)
  const costFilename = `${safeTitle}_Cost_Model_${dateStr}.xlsx`
  files.push({ name: costFilename, buffer: costBuffer })
  tocEntries.push({
    filename: costFilename,
    volume: 'Cost',
    format: 'xlsx',
    description: 'CLIN pricing and labor cost breakdown',
    isCUI: true,
  })

  // 4. Gate Decision Deck
  const compliancePct =
    complianceReqs && complianceReqs.length > 0
      ? Math.round(
          (complianceReqs.filter((r) => r.status === 'Addressed').length /
            complianceReqs.length) *
            100
        )
      : 0

  const gateData = buildGateDecisionData({
    opportunityTitle: title,
    agency: (opp.agency as string) ?? '',
    gateName: `${(opp.phase as string) ?? 'Gate'} Review`,
    gateNumber: 1,
    decision: (opp.pwin as number) >= 50 ? 'go' : 'conditional',
    pwin: (opp.pwin as number) ?? 0,
    complianceScore: compliancePct,
    risks: [],
    nextSteps: [],
    decisionDate: dateStr,
  })
  const gateBuffer = await generateGateDecisionDeck(gateData)
  const gateFilename = `${safeTitle}_Gate_Decision_${dateStr}.pptx`
  files.push({ name: gateFilename, buffer: gateBuffer })
  tocEntries.push({
    filename: gateFilename,
    volume: 'Gate Review',
    format: 'pptx',
    description: 'Go/No-Go recommendation deck',
  })

  // 5. Master TOC
  const tocBuffer = await generateBinderTOC(tocEntries, title, dateStr)
  const tocFilename = `${safeTitle}_TOC_${dateStr}.docx`
  files.push({ name: tocFilename, buffer: tocBuffer })

  // Package into ZIP
  const zipBuffer = await createZipBuffer(files)

  return {
    buffer: zipBuffer,
    filename: `${safeTitle}_Binder_${dateStr}.zip`,
    fileCount: files.length,
  }
}

// ─── ZIP Creation ────────────────────────────────────────────

function createZipBuffer(
  files: Array<{ name: string; buffer: Buffer | Uint8Array }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    for (const file of files) {
      archive.append(Buffer.from(file.buffer), { name: file.name })
    }

    archive.finalize()
  })
}
