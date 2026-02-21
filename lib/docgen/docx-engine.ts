/**
 * DOCX Generation Engine — server-side Word document generation.
 *
 * Three outputs:
 * 1. Technical Volume (formatted per RFP instructions with CUI banners)
 * 2. Key Personnel resumes (RFP-templated)
 * 3. FAR Risk Memo (clause analysis with risk ratings)
 *
 * All outputs include 'AI GENERATED — REQUIRES HUMAN REVIEW' watermark.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  ShadingType,
} from 'docx'

// ─── Brand Constants ─────────────────────────────────────────

const BRAND_CYAN = '00E5FA'
const BRAND_NAVY = '00050F'
const CUI_RED = 'EF4444'

// ─── Types ───────────────────────────────────────────────────

export interface TechVolumeSection {
  heading: string
  level: 1 | 2 | 3
  content: string[]
  cuiPortion?: boolean
}

export interface TechVolumeData {
  opportunityTitle: string
  solicitationNumber: string
  sections: TechVolumeSection[]
  isCUI?: boolean
}

export interface KeyPersonnelEntry {
  name: string
  role: string
  clearance?: string
  education: string[]
  certifications: string[]
  experienceSummary: string
  relevantProjects: Array<{
    title: string
    agency: string
    duration: string
    description: string
  }>
}

export interface KeyPersonnelData {
  opportunityTitle: string
  personnel: KeyPersonnelEntry[]
}

export interface FARClauseRisk {
  clauseNumber: string
  clauseTitle: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  summary: string
  recommendation: string
}

export interface FARRiskMemoData {
  opportunityTitle: string
  solicitationNumber: string
  clauses: FARClauseRisk[]
  preparedBy: string
  preparedDate: string
}

// ─── Helpers ─────────────────────────────────────────────────

function aiWatermarkHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'AI GENERATED — REQUIRES HUMAN REVIEW',
            color: 'FF8800',
            size: 16,
            bold: true,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}

function cuiBanner(label: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: label,
        color: CUI_RED,
        bold: true,
        size: 22,
        font: 'Inter',
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: '1A0000',
    },
  })
}

function pageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'MissionPulse — Mission Meets Tech, LLC | Page ',
            color: '94A3B8',
            size: 16,
            font: 'Inter',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: '94A3B8',
            size: 16,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}

function riskColor(level: string): string {
  if (level === 'critical') return CUI_RED
  if (level === 'high') return 'F59E0B'
  if (level === 'medium') return '94A3B8'
  return '10B981'
}

// ─── Technical Volume ────────────────────────────────────────

export async function generateTechVolume(
  data: TechVolumeData
): Promise<Buffer> {
  const children: Paragraph[] = []

  // CUI banner if applicable
  if (data.isCUI) {
    children.push(cuiBanner('CUI — CONTROLLED UNCLASSIFIED INFORMATION'))
  }

  // Title page content
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
      children: [
        new TextRun({
          text: 'TECHNICAL VOLUME',
          color: BRAND_CYAN,
          size: 36,
          bold: true,
          font: 'Inter',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: data.opportunityTitle,
          color: BRAND_NAVY,
          size: 28,
          bold: true,
          font: 'Inter',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Solicitation: ${data.solicitationNumber}`,
          color: '64748B',
          size: 22,
          font: 'Inter',
        }),
      ],
    })
  )

  // Sections
  for (const section of data.sections) {
    const headingLevel =
      section.level === 1
        ? HeadingLevel.HEADING_1
        : section.level === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3

    // CUI portion mark
    if (section.cuiPortion) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '(CUI) ',
              color: CUI_RED,
              bold: true,
              size: 18,
              font: 'Inter',
            }),
          ],
        })
      )
    }

    children.push(
      new Paragraph({
        heading: headingLevel,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            font: 'Inter',
            size: section.level === 1 ? 28 : section.level === 2 ? 24 : 22,
          }),
        ],
      })
    )

    for (const para of section.content) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: para,
              font: 'Inter',
              size: 22,
            }),
          ],
        })
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        headers: { default: aiWatermarkHeader() },
        footers: { default: pageFooter() },
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ─── Key Personnel ───────────────────────────────────────────

export async function generateKeyPersonnel(
  data: KeyPersonnelData
): Promise<Buffer> {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `KEY PERSONNEL — ${data.opportunityTitle}`,
          color: BRAND_CYAN,
          size: 32,
          bold: true,
          font: 'Inter',
        }),
      ],
    })
  )

  for (const person of data.personnel) {
    // Name & Role
    children.push(
      new Paragraph({
        spacing: { before: 300 },
        children: [
          new TextRun({
            text: person.name,
            bold: true,
            size: 26,
            font: 'Inter',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Proposed Role: ${person.role}`,
            color: BRAND_CYAN,
            size: 22,
            font: 'Inter',
          }),
        ],
      })
    )

    if (person.clearance) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Clearance: ${person.clearance}`,
              size: 20,
              font: 'Inter',
              color: '64748B',
            }),
          ],
        })
      )
    }

    // Education
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: 'Education',
            bold: true,
            size: 22,
            font: 'Inter',
          }),
        ],
      })
    )
    for (const edu of person.education) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: edu, size: 20, font: 'Inter' })],
        })
      )
    }

    // Certifications
    if (person.certifications.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({
              text: 'Certifications',
              bold: true,
              size: 22,
              font: 'Inter',
            }),
          ],
        })
      )
      for (const cert of person.certifications) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: cert, size: 20, font: 'Inter' })],
          })
        )
      }
    }

    // Experience summary
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: 'Experience Summary',
            bold: true,
            size: 22,
            font: 'Inter',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: person.experienceSummary,
            size: 20,
            font: 'Inter',
          }),
        ],
      })
    )

    // Relevant projects
    if (person.relevantProjects.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({
              text: 'Relevant Projects',
              bold: true,
              size: 22,
              font: 'Inter',
            }),
          ],
        })
      )
      for (const proj of person.relevantProjects) {
        children.push(
          new Paragraph({
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: `${proj.title} — ${proj.agency}`,
                bold: true,
                size: 20,
                font: 'Inter',
              }),
              new TextRun({
                text: ` (${proj.duration})`,
                color: '64748B',
                size: 20,
                font: 'Inter',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: proj.description,
                size: 20,
                font: 'Inter',
              }),
            ],
          })
        )
      }
    }

    // Separator
    children.push(
      new Paragraph({
        spacing: { before: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
        children: [],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        headers: { default: aiWatermarkHeader() },
        footers: { default: pageFooter() },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ─── FAR Risk Memo ───────────────────────────────────────────

export async function generateFARRiskMemo(
  data: FARRiskMemoData
): Promise<Buffer> {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'FAR/DFARS RISK MEMORANDUM',
          color: BRAND_CYAN,
          size: 32,
          bold: true,
          font: 'Inter',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: data.opportunityTitle,
          size: 24,
          bold: true,
          font: 'Inter',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Solicitation: ${data.solicitationNumber}`,
          color: '64748B',
          size: 20,
          font: 'Inter',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Prepared by: ${data.preparedBy} | ${data.preparedDate}`,
          color: '64748B',
          size: 18,
          font: 'Inter',
        }),
      ],
    })
  )

  // Summary stats
  const critical = data.clauses.filter((c) => c.riskLevel === 'critical').length
  const high = data.clauses.filter((c) => c.riskLevel === 'high').length
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Summary: ${data.clauses.length} clauses analyzed — `,
          size: 22,
          font: 'Inter',
        }),
        new TextRun({
          text: `${critical} critical`,
          color: CUI_RED,
          bold: true,
          size: 22,
          font: 'Inter',
        }),
        new TextRun({
          text: `, ${high} high risk`,
          color: 'F59E0B',
          bold: true,
          size: 22,
          font: 'Inter',
        }),
      ],
    })
  )

  // Clause table
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeHeaderCell('Clause', 1400),
      makeHeaderCell('Title', 2400),
      makeHeaderCell('Risk', 1000),
      makeHeaderCell('Summary', 2600),
      makeHeaderCell('Recommendation', 2600),
    ],
  })

  const rows = data.clauses.map(
    (clause) =>
      new TableRow({
        children: [
          makeBodyCell(clause.clauseNumber, 1400),
          makeBodyCell(clause.clauseTitle, 2400),
          makeRiskCell(clause.riskLevel, 1000),
          makeBodyCell(clause.summary, 2600),
          makeBodyCell(clause.recommendation, 2600),
        ],
      })
  )

  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [],
    })
  )

  const table = new Table({
    rows: [headerRow, ...rows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })

  const doc = new Document({
    sections: [
      {
        headers: { default: aiWatermarkHeader() },
        footers: { default: pageFooter() },
        children: [...children, table],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ─── Table Cell Helpers ──────────────────────────────────────

function makeHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: '1E293B' },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: BRAND_CYAN,
            size: 18,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}

function makeBodyCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 18,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}

function makeRiskCell(level: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: riskColor(level) + '30' },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: level.toUpperCase(),
            bold: true,
            color: riskColor(level),
            size: 18,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}
