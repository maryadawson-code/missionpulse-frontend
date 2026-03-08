import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock PptxGenJS ─────────────────────────────────────────

const mockAddText = vi.fn()
const mockAddNotes = vi.fn()
const mockAddShape = vi.fn()
const mockAddTable = vi.fn()
const mockAddSlide = vi.fn().mockReturnValue({
  addText: mockAddText,
  addNotes: mockAddNotes,
  addShape: mockAddShape,
  addTable: mockAddTable,
})
const mockDefineSlideMaster = vi.fn()
const mockWrite = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))

vi.mock('pptxgenjs', () => {
  return {
    default: class MockPptxGenJS {
      author = ''
      company = ''
      layout = ''
      title = ''
      ShapeType = { roundRect: 'roundRect' }
      addSlide = mockAddSlide
      defineSlideMaster = mockDefineSlideMaster
      write = mockWrite
    },
  }
})

import {
  generateOralsDeck,
  generateGateDecisionDeck,
} from '@/lib/docgen/pptx-engine'
import type { OralsData, GateDecisionData } from '@/lib/docgen/pptx-engine'

// ─── Tests ──────────────────────────────────────────────────

describe('pptx-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddSlide.mockReturnValue({
      addText: mockAddText,
      addNotes: mockAddNotes,
      addShape: mockAddShape,
      addTable: mockAddTable,
    })
  })

  describe('generateOralsDeck', () => {
    const basicData: OralsData = {
      opportunityTitle: 'VA EHR Modernization',
      agency: 'Department of Veterans Affairs',
      slides: [
        {
          title: 'Technical Approach',
          bullets: ['Bullet 1', 'Bullet 2'],
          speakerNotes: 'Notes here',
        },
      ],
      qaItems: [],
    }

    it('should generate a Uint8Array', async () => {
      const result = await generateOralsDeck(basicData)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should create title and agenda slides plus content slides', async () => {
      await generateOralsDeck(basicData)

      // Title slide + agenda slide + 1 content slide = 3
      expect(mockAddSlide).toHaveBeenCalledTimes(3)
    })

    it('should add speaker notes when present', async () => {
      await generateOralsDeck(basicData)
      expect(mockAddNotes).toHaveBeenCalledWith('Notes here')
    })

    it('should include presentation date when provided', async () => {
      const data: OralsData = {
        ...basicData,
        presentationDate: '2025-03-15',
      }

      await generateOralsDeck(data)
      expect(mockAddText).toHaveBeenCalledWith(
        expect.stringContaining('2025-03-15'),
        expect.any(Object)
      )
    })

    it('should generate Q&A slides when qaItems provided', async () => {
      const data: OralsData = {
        ...basicData,
        qaItems: [
          { question: 'Q1?', suggestedAnswer: 'A1', difficulty: 'easy' },
          { question: 'Q2?', suggestedAnswer: 'A2', difficulty: 'medium' },
          { question: 'Q3?', suggestedAnswer: 'A3', difficulty: 'hard' },
        ],
      }

      await generateOralsDeck(data)
      // Title + agenda + 1 content + Q&A header + 3 Q&A slides = 7
      expect(mockAddSlide).toHaveBeenCalledTimes(7)
    })

    it('should apply branding', async () => {
      await generateOralsDeck(basicData)
      expect(mockDefineSlideMaster).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'MISSION_PULSE' })
      )
    })
  })

  describe('generateGateDecisionDeck', () => {
    const basicGateData: GateDecisionData = {
      opportunityTitle: 'DHS Cyber Program',
      agency: 'DHS',
      gateName: 'Capture Review',
      gateNumber: 2,
      recommendation: 'go',
      pwin: 65,
      metrics: [
        { label: 'pWin', value: '65%', status: 'green' },
        { label: 'Compliance', value: '90%', status: 'green' },
      ],
      risks: [],
      nextSteps: [],
    }

    it('should generate a Uint8Array', async () => {
      const result = await generateGateDecisionDeck(basicGateData)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should create title and metrics slides', async () => {
      await generateGateDecisionDeck(basicGateData)
      // Title slide + metrics dashboard = 2
      expect(mockAddSlide).toHaveBeenCalledTimes(2)
    })

    it('should create risk slide when risks provided', async () => {
      const data: GateDecisionData = {
        ...basicGateData,
        risks: [
          { risk: 'Staffing gaps', severity: 'high', mitigation: 'Hire more' },
          { risk: 'Timeline', severity: 'medium', mitigation: 'Adjust schedule' },
        ],
      }

      await generateGateDecisionDeck(data)
      // Title + metrics + risks = 3
      expect(mockAddSlide).toHaveBeenCalledTimes(3)
    })

    it('should create next steps slide when steps provided', async () => {
      const data: GateDecisionData = {
        ...basicGateData,
        nextSteps: ['Step 1', 'Step 2'],
      }

      await generateGateDecisionDeck(data)
      // Title + metrics + next steps = 3
      expect(mockAddSlide).toHaveBeenCalledTimes(3)
    })

    it('should handle no_go recommendation', async () => {
      const data: GateDecisionData = {
        ...basicGateData,
        recommendation: 'no_go',
      }

      const result = await generateGateDecisionDeck(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(mockAddText).toHaveBeenCalledWith(
        expect.stringContaining('NO-GO'),
        expect.any(Object)
      )
    })

    it('should handle conditional recommendation', async () => {
      const data: GateDecisionData = {
        ...basicGateData,
        recommendation: 'conditional',
      }

      const result = await generateGateDecisionDeck(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(mockAddText).toHaveBeenCalledWith(
        expect.stringContaining('CONDITIONAL GO'),
        expect.any(Object)
      )
    })
  })
})
