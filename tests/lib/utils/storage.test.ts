import { describe, it, expect, vi } from 'vitest'
import {
  DOCUMENTS_BUCKET,
  DOCUMENT_CATEGORIES,
  buildDocumentPath,
  buildCompanyDocumentPath,
  formatFileSize,
  getFileIcon,
} from '@/lib/utils/storage'

describe('storage constants', () => {
  it('DOCUMENTS_BUCKET is "documents"', () => {
    expect(DOCUMENTS_BUCKET).toBe('documents')
  })

  it('DOCUMENT_CATEGORIES contains expected values', () => {
    expect(DOCUMENT_CATEGORIES).toContain('Technical')
    expect(DOCUMENT_CATEGORIES).toContain('Management')
    expect(DOCUMENT_CATEGORIES).toContain('Cost')
    expect(DOCUMENT_CATEGORIES.length).toBe(5)
  })
})

describe('buildDocumentPath', () => {
  it('builds path with opportunity ID and filename', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const path = buildDocumentPath('opp-123', 'test.pdf')
    expect(path).toBe(`opportunities/opp-123/${now}_test.pdf`)
    vi.restoreAllMocks()
  })
})

describe('buildCompanyDocumentPath', () => {
  it('builds path with company ID and filename', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const path = buildCompanyDocumentPath('comp-456', 'report.docx')
    expect(path).toBe(`company/comp-456/${now}_report.docx`)
    vi.restoreAllMocks()
  })
})

describe('formatFileSize', () => {
  it('returns dash for null/0', () => {
    expect(formatFileSize(null)).toBe('—')
    expect(formatFileSize(0)).toBe('—')
  })

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats KB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats MB', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('getFileIcon', () => {
  it('returns pdf for PDF mime type', () => {
    expect(getFileIcon('application/pdf')).toBe('pdf')
  })

  it('returns doc for Word mime type', () => {
    expect(getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('doc')
  })

  it('returns image for image mime types', () => {
    expect(getFileIcon('image/png')).toBe('image')
  })

  it('returns file for unknown mime types', () => {
    expect(getFileIcon('application/octet-stream')).toBe('file')
  })

  it('returns file for null', () => {
    expect(getFileIcon(null)).toBe('file')
  })
})
