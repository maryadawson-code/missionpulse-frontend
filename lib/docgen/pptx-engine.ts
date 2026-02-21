/**
 * PPTX Generation Engine — server-side PowerPoint generation.
 *
 * Two templates:
 * 1. Orals Prep deck (slides + speaker notes + Q&A appendix)
 * 2. Gate Decision deck (Go/No-Go recommendation with metrics)
 *
 * MMT branding: Primary Cyan (#00E5FA) headers, Deep Navy (#00050F)
 * backgrounds, Inter font.
 */

import PptxGenJS from 'pptxgenjs'

// ─── Brand Constants ─────────────────────────────────────────

const BRAND = {
  navy: '00050F',
  navySurface: '0F172A',
  cyan: '00E5FA',
  white: 'FFFFFF',
  gray: '94A3B8',
  green: '10B981',
  yellow: 'F59E0B',
  red: 'EF4444',
  font: 'Inter',
} as const

// ─── Types ───────────────────────────────────────────────────

export interface OralsSlide {
  title: string
  bullets: string[]
  speakerNotes?: string
}

export interface OralsQA {
  question: string
  suggestedAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface OralsData {
  opportunityTitle: string
  agency: string
  presentationDate?: string
  slides: OralsSlide[]
  qaItems: OralsQA[]
}

export interface GateMetric {
  label: string
  value: string
  status: 'green' | 'yellow' | 'red'
}

export interface GateRisk {
  risk: string
  severity: 'high' | 'medium' | 'low'
  mitigation: string
}

export interface GateDecisionData {
  opportunityTitle: string
  agency: string
  gateName: string
  gateNumber: number
  recommendation: 'go' | 'no_go' | 'conditional'
  pwin: number
  metrics: GateMetric[]
  risks: GateRisk[]
  nextSteps: string[]
  decisionDate?: string
}

// ─── Helper ──────────────────────────────────────────────────

function applyBranding(pptx: PptxGenJS): void {
  pptx.author = 'MissionPulse'
  pptx.company = 'Mission Meets Tech, LLC'
  pptx.layout = 'LAYOUT_WIDE'

  pptx.defineSlideMaster({
    title: 'MISSION_PULSE',
    background: { color: BRAND.navy },
    objects: [
      {
        text: {
          text: 'MISSIONPULSE',
          options: {
            x: 0.5,
            y: 7.0,
            w: 3,
            h: 0.3,
            fontSize: 8,
            color: BRAND.gray,
            fontFace: BRAND.font,
          },
        },
      },
    ],
  })
}

function statusColor(status: 'green' | 'yellow' | 'red'): string {
  return status === 'green' ? BRAND.green : status === 'yellow' ? BRAND.yellow : BRAND.red
}

// ─── Orals Template ──────────────────────────────────────────

export function generateOralsDeck(data: OralsData): Promise<Uint8Array> {
  const pptx = new PptxGenJS()
  applyBranding(pptx)
  pptx.title = `Orals Prep — ${data.opportunityTitle}`

  // Title slide
  const titleSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
  titleSlide.addText('ORALS PREPARATION', {
    x: 0.5,
    y: 1.5,
    w: 12,
    h: 0.8,
    fontSize: 14,
    color: BRAND.cyan,
    fontFace: BRAND.font,
    bold: true,
    align: 'left',
  })
  titleSlide.addText(data.opportunityTitle, {
    x: 0.5,
    y: 2.3,
    w: 12,
    h: 1.2,
    fontSize: 32,
    color: BRAND.white,
    fontFace: BRAND.font,
    bold: true,
  })
  titleSlide.addText(data.agency, {
    x: 0.5,
    y: 3.5,
    w: 12,
    h: 0.5,
    fontSize: 18,
    color: BRAND.gray,
    fontFace: BRAND.font,
  })
  if (data.presentationDate) {
    titleSlide.addText(`Presentation Date: ${data.presentationDate}`, {
      x: 0.5,
      y: 4.2,
      w: 12,
      h: 0.4,
      fontSize: 14,
      color: BRAND.gray,
      fontFace: BRAND.font,
    })
  }

  // Agenda slide
  const agendaSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
  agendaSlide.addText('AGENDA', {
    x: 0.5,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontSize: 24,
    color: BRAND.cyan,
    fontFace: BRAND.font,
    bold: true,
  })
  const agendaItems = data.slides.map((s, i) => ({
    text: `${i + 1}. ${s.title}`,
    options: {
      fontSize: 16,
      color: BRAND.white,
      fontFace: BRAND.font,
      bullet: false as const,
      paraSpaceBefore: 8,
    },
  }))
  agendaSlide.addText(agendaItems, {
    x: 0.5,
    y: 1.3,
    w: 12,
    h: 5,
  })

  // Content slides
  for (const slide of data.slides) {
    const s = pptx.addSlide({ masterName: 'MISSION_PULSE' })
    s.addText(slide.title.toUpperCase(), {
      x: 0.5,
      y: 0.4,
      w: 12,
      h: 0.6,
      fontSize: 22,
      color: BRAND.cyan,
      fontFace: BRAND.font,
      bold: true,
    })

    const bullets = slide.bullets.map((b) => ({
      text: b,
      options: {
        fontSize: 14,
        color: BRAND.white,
        fontFace: BRAND.font,
        bullet: { code: '25CF' } as { code: string },
        paraSpaceBefore: 6,
      },
    }))
    s.addText(bullets, {
      x: 0.5,
      y: 1.3,
      w: 12,
      h: 5.2,
    })

    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes)
    }
  }

  // Q&A Appendix
  if (data.qaItems.length > 0) {
    const qaHeader = pptx.addSlide({ masterName: 'MISSION_PULSE' })
    qaHeader.addText('Q&A PREPARATION', {
      x: 0.5,
      y: 2.5,
      w: 12,
      h: 1,
      fontSize: 32,
      color: BRAND.cyan,
      fontFace: BRAND.font,
      bold: true,
      align: 'center',
    })
    qaHeader.addText(`${data.qaItems.length} anticipated questions`, {
      x: 0.5,
      y: 3.5,
      w: 12,
      h: 0.5,
      fontSize: 16,
      color: BRAND.gray,
      fontFace: BRAND.font,
      align: 'center',
    })

    for (const qa of data.qaItems) {
      const qaSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
      const diffColor =
        qa.difficulty === 'hard'
          ? BRAND.red
          : qa.difficulty === 'medium'
            ? BRAND.yellow
            : BRAND.green
      qaSlide.addText(qa.difficulty.toUpperCase(), {
        x: 0.5,
        y: 0.3,
        w: 2,
        h: 0.35,
        fontSize: 10,
        color: diffColor,
        fontFace: BRAND.font,
        bold: true,
      })
      qaSlide.addText(qa.question, {
        x: 0.5,
        y: 0.8,
        w: 12,
        h: 1,
        fontSize: 20,
        color: BRAND.white,
        fontFace: BRAND.font,
        bold: true,
      })
      qaSlide.addText('SUGGESTED RESPONSE', {
        x: 0.5,
        y: 2.1,
        w: 12,
        h: 0.4,
        fontSize: 11,
        color: BRAND.cyan,
        fontFace: BRAND.font,
        bold: true,
      })
      qaSlide.addText(qa.suggestedAnswer, {
        x: 0.5,
        y: 2.6,
        w: 12,
        h: 4,
        fontSize: 14,
        color: BRAND.gray,
        fontFace: BRAND.font,
      })
    }
  }

  return pptx.write({ outputType: 'uint8array' }) as Promise<Uint8Array>
}

// ─── Gate Decision Template ──────────────────────────────────

export function generateGateDecisionDeck(
  data: GateDecisionData
): Promise<Uint8Array> {
  const pptx = new PptxGenJS()
  applyBranding(pptx)
  pptx.title = `Gate ${data.gateNumber} Decision — ${data.opportunityTitle}`

  const recColor =
    data.recommendation === 'go'
      ? BRAND.green
      : data.recommendation === 'no_go'
        ? BRAND.red
        : BRAND.yellow
  const recLabel =
    data.recommendation === 'go'
      ? 'GO'
      : data.recommendation === 'no_go'
        ? 'NO-GO'
        : 'CONDITIONAL GO'

  // Title + Recommendation
  const titleSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
  titleSlide.addText(`GATE ${data.gateNumber}: ${data.gateName.toUpperCase()}`, {
    x: 0.5,
    y: 0.4,
    w: 12,
    h: 0.5,
    fontSize: 14,
    color: BRAND.cyan,
    fontFace: BRAND.font,
    bold: true,
  })
  titleSlide.addText(data.opportunityTitle, {
    x: 0.5,
    y: 1.2,
    w: 12,
    h: 1,
    fontSize: 28,
    color: BRAND.white,
    fontFace: BRAND.font,
    bold: true,
  })
  titleSlide.addText(data.agency, {
    x: 0.5,
    y: 2.2,
    w: 12,
    h: 0.5,
    fontSize: 16,
    color: BRAND.gray,
    fontFace: BRAND.font,
  })
  titleSlide.addText(`RECOMMENDATION: ${recLabel}`, {
    x: 0.5,
    y: 3.5,
    w: 12,
    h: 0.8,
    fontSize: 28,
    color: recColor,
    fontFace: BRAND.font,
    bold: true,
  })
  titleSlide.addText(`pWin: ${data.pwin}%`, {
    x: 0.5,
    y: 4.5,
    w: 12,
    h: 0.5,
    fontSize: 18,
    color: BRAND.white,
    fontFace: BRAND.font,
  })

  // Metrics dashboard
  const metricsSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
  metricsSlide.addText('METRICS DASHBOARD', {
    x: 0.5,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontSize: 22,
    color: BRAND.cyan,
    fontFace: BRAND.font,
    bold: true,
  })

  const cols = Math.min(data.metrics.length, 4)
  const cardWidth = 11 / cols
  data.metrics.forEach((metric, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = 0.5 + col * (cardWidth + 0.2)
    const y = 1.5 + row * 2

    metricsSlide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cardWidth,
      h: 1.6,
      fill: { color: BRAND.navySurface },
      rectRadius: 0.1,
      line: { color: statusColor(metric.status), width: 1 },
    })
    metricsSlide.addText(metric.label.toUpperCase(), {
      x,
      y: y + 0.2,
      w: cardWidth,
      h: 0.3,
      fontSize: 10,
      color: BRAND.gray,
      fontFace: BRAND.font,
      align: 'center',
    })
    metricsSlide.addText(metric.value, {
      x,
      y: y + 0.6,
      w: cardWidth,
      h: 0.6,
      fontSize: 24,
      color: statusColor(metric.status),
      fontFace: BRAND.font,
      bold: true,
      align: 'center',
    })
  })

  // Risk factors
  if (data.risks.length > 0) {
    const riskSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
    riskSlide.addText('RISK FACTORS', {
      x: 0.5,
      y: 0.4,
      w: 12,
      h: 0.6,
      fontSize: 22,
      color: BRAND.cyan,
      fontFace: BRAND.font,
      bold: true,
    })

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: 'RISK', options: { bold: true, color: BRAND.cyan, fill: { color: BRAND.navySurface }, fontSize: 11, fontFace: BRAND.font } },
        { text: 'SEVERITY', options: { bold: true, color: BRAND.cyan, fill: { color: BRAND.navySurface }, fontSize: 11, fontFace: BRAND.font } },
        { text: 'MITIGATION', options: { bold: true, color: BRAND.cyan, fill: { color: BRAND.navySurface }, fontSize: 11, fontFace: BRAND.font } },
      ],
    ]

    for (const risk of data.risks) {
      const sevColor =
        risk.severity === 'high'
          ? BRAND.red
          : risk.severity === 'medium'
            ? BRAND.yellow
            : BRAND.green
      tableRows.push([
        { text: risk.risk, options: { color: BRAND.white, fontSize: 11, fontFace: BRAND.font } },
        { text: risk.severity.toUpperCase(), options: { color: sevColor, fontSize: 11, fontFace: BRAND.font, bold: true } },
        { text: risk.mitigation, options: { color: BRAND.gray, fontSize: 11, fontFace: BRAND.font } },
      ])
    }

    riskSlide.addTable(tableRows, {
      x: 0.5,
      y: 1.3,
      w: 12,
      border: { type: 'solid', color: BRAND.navySurface, pt: 1 },
      colW: [4, 2, 6],
    })
  }

  // Next steps
  if (data.nextSteps.length > 0) {
    const nextSlide = pptx.addSlide({ masterName: 'MISSION_PULSE' })
    nextSlide.addText('NEXT STEPS', {
      x: 0.5,
      y: 0.4,
      w: 12,
      h: 0.6,
      fontSize: 22,
      color: BRAND.cyan,
      fontFace: BRAND.font,
      bold: true,
    })

    const steps = data.nextSteps.map((step, i) => ({
      text: `${i + 1}. ${step}`,
      options: {
        fontSize: 16,
        color: BRAND.white,
        fontFace: BRAND.font,
        paraSpaceBefore: 10,
        bullet: false as const,
      },
    }))
    nextSlide.addText(steps, {
      x: 0.5,
      y: 1.3,
      w: 12,
      h: 5,
    })
  }

  return pptx.write({ outputType: 'uint8array' }) as Promise<Uint8Array>
}
