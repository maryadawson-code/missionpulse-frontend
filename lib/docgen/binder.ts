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
    .select('id, title, agency, ceiling, pwin, phase, company_id, status')
    .eq('id', opportunityId)
    .single()

  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`)

  const title = (opp.title as string) ?? 'Untitled'
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
  const dateStr = new Date().toISOString().split('T')[0]
  const companyId = opp.company_id as string

  // Fetch company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyName = (company?.name as string) ?? 'Company'

  // Fetch related data
  const [
    { data: sections },
    { data: complianceReqs },
    { data: teamMembers },
  ] = await Promise.all([
    supabase
      .from('proposal_sections')
      .select('id, title, content, section_number, status')
      .eq('opportunity_id', opportunityId)
      .order('section_number'),
    supabase
      .from('compliance_requirements')
      .select('id, requirement_text, status, section_reference')
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
  const techData = buildTechVolumeData({
    opportunityTitle: title,
    companyName,
    sections: (sections ?? []).map((s) => ({
      title: (s.title as string) ?? '',
      content: (s.content as string) ?? '',
      sectionNumber: (s.section_number as string) ?? '',
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
      id: r.id as string,
      text: (r.requirement_text as string) ?? '',
      status: (r.status as string) ?? 'Not Addressed',
      section: (r.section_reference as string) ?? '',
    }))
  )
  const complianceBuffer = await generateComplianceMatrix({
    opportunityTitle: title,
    rows: complianceRows,
  })
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
  const costBuffer = await generateCostModel({
    opportunityTitle: title,
    clins: costCLINs,
  })
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
  const gateData = buildGateDecisionData({
    opportunityTitle: title,
    agency: (opp.agency as string) ?? '',
    ceiling: (opp.ceiling as number) ?? 0,
    pwin: (opp.pwin as number) ?? 0,
    phase: (opp.phase as string) ?? '',
    compliancePct:
      complianceReqs && complianceReqs.length > 0
        ? Math.round(
            (complianceReqs.filter(
              (r) => (r.status as string) === 'Addressed'
            ).length /
              complianceReqs.length) *
              100
          )
        : 0,
    teamCount: teamMembers?.length ?? 0,
    companyName,
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
