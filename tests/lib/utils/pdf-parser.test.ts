import { describe, it, expect, vi } from 'vitest'

const { mockDestroy, mockGetTextContent, mockGetPage, mockGetMetadata, mockDoc } = vi.hoisted(() => {
  const mockDestroy = vi.fn().mockResolvedValue(undefined)
  const mockGetTextContent = vi.fn().mockResolvedValue({
    items: [{ str: 'Hello' }, { str: 'World' }],
  })
  const mockGetPage = vi.fn().mockResolvedValue({
    getTextContent: mockGetTextContent,
  })
  const mockGetMetadata = vi.fn().mockResolvedValue({
    info: { Title: 'Test PDF', Author: 'Jane Doe' },
  })
  const mockDoc = {
    numPages: 2,
    getPage: mockGetPage,
    getMetadata: mockGetMetadata,
    destroy: mockDestroy,
  }
  return { mockDestroy, mockGetTextContent, mockGetPage, mockGetMetadata, mockDoc }
})

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve(mockDoc),
  }),
}))

import { extractPdfText } from '@/lib/utils/pdf-parser'

describe('extractPdfText', () => {
  it('extracts text from all pages', async () => {
    const result = await extractPdfText(Buffer.from('fake-pdf'))
    expect(result.text).toContain('Hello')
    expect(result.text).toContain('World')
    expect(result.pageCount).toBe(2)
  })

  it('extracts metadata', async () => {
    const result = await extractPdfText(Buffer.from('fake-pdf'))
    expect(result.info.title).toBe('Test PDF')
    expect(result.info.author).toBe('Jane Doe')
  })

  it('calls destroy on the document', async () => {
    await extractPdfText(Buffer.from('fake-pdf'))
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('throws for files exceeding 50MB', async () => {
    const largeBuffer = Buffer.alloc(51 * 1024 * 1024)
    await expect(extractPdfText(largeBuffer)).rejects.toThrow('File exceeds maximum size of 50MB')
  })

  it('handles password-protected PDFs', async () => {
    mockGetPage.mockRejectedValueOnce(new Error('password required'))
    // The function catches errors after getting the doc
    // Need to make the first getPage call fail with password
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const errorDoc = {
      numPages: 1,
      getPage: vi.fn().mockRejectedValue(new Error('password required')),
      getMetadata: vi.fn(),
      destroy: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce({
      promise: Promise.resolve(errorDoc),
    } as never)

    await expect(extractPdfText(Buffer.from('encrypted'))).rejects.toThrow(
      'password-protected'
    )
  })

  it('handles general parse errors', async () => {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const errorDoc = {
      numPages: 1,
      getPage: vi.fn().mockRejectedValue(new Error('corrupt data')),
      getMetadata: vi.fn(),
      destroy: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce({
      promise: Promise.resolve(errorDoc),
    } as never)

    await expect(extractPdfText(Buffer.from('bad'))).rejects.toThrow(
      'Failed to parse PDF: corrupt data'
    )
  })
})
