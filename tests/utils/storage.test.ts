import { describe, it, expect } from 'vitest'
import {
  DOCUMENTS_BUCKET,
  DOCUMENT_CATEGORIES,
  buildDocumentPath,
  buildCompanyDocumentPath,
  formatFileSize,
  getFileIcon,
} from '@/lib/utils/storage'

describe('Storage Utils', () => {
  describe('constants', () => {
    it('DOCUMENTS_BUCKET is documents', () => {
      expect(DOCUMENTS_BUCKET).toBe('documents')
    })
    it('DOCUMENT_CATEGORIES has 5 categories', () => {
      expect(DOCUMENT_CATEGORIES).toHaveLength(5)
      expect(DOCUMENT_CATEGORIES).toContain('Technical')
      expect(DOCUMENT_CATEGORIES).toContain('Cost')
    })
  })

  describe('buildDocumentPath', () => {
    it('builds path with opportunity ID and filename', () => {
      const path = buildDocumentPath('opp-123', 'proposal.pdf')
      expect(path).toMatch(/^opportunities\/opp-123\/\d+_proposal\.pdf$/)
    })
  })

  describe('buildCompanyDocumentPath', () => {
    it('builds path with company ID and filename', () => {
      const path = buildCompanyDocumentPath('co-1', 'logo.png')
      expect(path).toMatch(/^company\/co-1\/\d+_logo\.png$/)
    })
  })

  describe('formatFileSize', () => {
    it('returns — for null', () => {
      expect(formatFileSize(null)).toBe('—')
    })
    it('returns — for 0', () => {
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
    it('returns file for null', () => {
      expect(getFileIcon(null)).toBe('file')
    })
    it('returns pdf for PDF mime', () => {
      expect(getFileIcon('application/pdf')).toBe('pdf')
    })
    it('returns doc for Word mime', () => {
      expect(getFileIcon('application/msword')).toBe('doc')
      expect(getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('doc')
    })
    it('returns image for image mime', () => {
      expect(getFileIcon('image/png')).toBe('image')
      expect(getFileIcon('image/jpeg')).toBe('image')
    })
    it('returns file for unknown mime', () => {
      expect(getFileIcon('application/zip')).toBe('file')
    })
  })
})
