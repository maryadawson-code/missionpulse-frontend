import { describe, it, expect, vi } from 'vitest'

vi.mock('jszip', () => {
  const mockFile = (content: string | null) => {
    if (content === null) return null
    return { async: vi.fn().mockResolvedValue(content) }
  }

  return {
    default: {
      loadAsync: vi.fn().mockResolvedValue({
        file: vi.fn((path: string) => {
          if (path === 'word/document.xml') {
            return mockFile(
              '<w:p><w:r><w:t>Hello</w:t></w:r></w:p>' +
              '<w:p><w:r><w:t>World</w:t></w:r></w:p>'
            )
          }
          if (path === 'docProps/core.xml') {
            return mockFile(
              '<dc:title>Test Doc</dc:title><dc:creator>Author Name</dc:creator>'
            )
          }
          return null
        }),
      }),
    },
  }
})

import { extractDocxText } from '@/lib/utils/docx-parser'

describe('extractDocxText', () => {
  it('extracts text from w:t elements', async () => {
    const result = await extractDocxText(Buffer.from('fake-docx'))
    expect(result.text).toContain('Hello')
    expect(result.text).toContain('World')
  })

  it('extracts title and author from core.xml', async () => {
    const result = await extractDocxText(Buffer.from('fake-docx'))
    expect(result.info.title).toBe('Test Doc')
    expect(result.info.author).toBe('Author Name')
  })

  it('returns pageCount 0 (DOCX has no reliable page count)', async () => {
    const result = await extractDocxText(Buffer.from('fake-docx'))
    expect(result.pageCount).toBe(0)
  })

  it('throws when document.xml is missing', async () => {
    const JSZip = (await import('jszip')).default
    vi.mocked(JSZip.loadAsync).mockResolvedValueOnce({
      file: vi.fn().mockReturnValue(null),
    } as never)

    await expect(extractDocxText(Buffer.from('bad'))).rejects.toThrow(
      'Invalid DOCX file: missing word/document.xml'
    )
  })
})
