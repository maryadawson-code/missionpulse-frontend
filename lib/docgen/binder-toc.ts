/**
 * Binder TOC generator — creates a master table of contents
 * document listing all files in the binder ZIP.
 */

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Packer,
} from 'docx'

// ─── Types ───────────────────────────────────────────────────

export interface TOCEntry {
  filename: string
  volume: string
  format: string
  description: string
  isCUI?: boolean
}

// ─── Generator ───────────────────────────────────────────────

export async function generateBinderTOC(
  entries: TOCEntry[],
  opportunityTitle: string,
  generatedDate: string
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'PROPOSAL BINDER — TABLE OF CONTENTS',
          color: '00E5FA',
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
          text: opportunityTitle,
          size: 26,
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
          text: `Generated: ${generatedDate} | MissionPulse`,
          color: '64748B',
          size: 18,
          font: 'Inter',
        }),
      ],
    })
  )

  // Table
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      tocHeaderCell('#', 500),
      tocHeaderCell('Volume', 2000),
      tocHeaderCell('Filename', 3000),
      tocHeaderCell('Format', 1000),
      tocHeaderCell('Description', 3500),
    ],
  })

  const rows = entries.map(
    (entry, i) =>
      new TableRow({
        children: [
          tocBodyCell(String(i + 1), 500),
          tocBodyCell(entry.volume, 2000, entry.isCUI),
          tocBodyCell(entry.filename, 3000),
          tocBodyCell(entry.format.toUpperCase(), 1000),
          tocBodyCell(entry.description, 3500),
        ],
      })
  )

  const table = new Table({
    rows: [headerRow, ...rows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })

  // CUI notice
  const cuiEntries = entries.filter((e) => e.isCUI)
  if (cuiEntries.length > 0) {
    children.push(table)
    children.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: 'CUI NOTICE: ',
            color: 'EF4444',
            bold: true,
            size: 20,
            font: 'Inter',
          }),
          new TextRun({
            text: `${cuiEntries.length} file(s) in this binder contain Controlled Unclassified Information. Handle per NIST 800-171.`,
            color: '94A3B8',
            size: 20,
            font: 'Inter',
          }),
        ],
      })
    )
  } else {
    children.push(table)
  }

  const doc = new Document({
    sections: [{ children }],
  })

  return Packer.toBuffer(doc)
}

// ─── Helpers ─────────────────────────────────────────────────

function tocHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: '1E293B' },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: '00E5FA',
            size: 18,
            font: 'Inter',
          }),
        ],
      }),
    ],
  })
}

function tocBodyCell(
  text: string,
  width: number,
  isCUI?: boolean
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 18,
            font: 'Inter',
            color: isCUI ? 'EF4444' : undefined,
          }),
        ],
      }),
    ],
  })
}
