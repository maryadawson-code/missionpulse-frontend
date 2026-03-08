import { describe, it, expect, vi } from 'vitest'

const { mockSlideXml, mockCoreXml } = vi.hoisted(() => ({
  mockSlideXml: '<a:p><a:r><a:t>Slide Text</a:t></a:r></a:p>',
  mockCoreXml: '<dc:title>My Presentation</dc:title><dc:creator>John</dc:creator>',
}))

vi.mock('jszip', () => {
  return {
    default: {
      loadAsync: vi.fn().mockResolvedValue({
        files: {
          'ppt/slides/slide1.xml': {},
          'ppt/slides/slide2.xml': {},
        },
        file: vi.fn((path: string) => {
          if (path === 'ppt/slides/slide1.xml' || path === 'ppt/slides/slide2.xml') {
            return { async: vi.fn().mockResolvedValue(mockSlideXml) }
          }
          if (path === 'docProps/core.xml') {
            return { async: vi.fn().mockResolvedValue(mockCoreXml) }
          }
          return null
        }),
      }),
    },
  }
})

import { extractPptxText } from '@/lib/utils/pptx-parser'

describe('extractPptxText', () => {
  it('extracts text from slides', async () => {
    const result = await extractPptxText(Buffer.from('fake-pptx'))
    expect(result.text).toContain('Slide Text')
    expect(result.text).toContain('--- Slide 1 ---')
    expect(result.text).toContain('--- Slide 2 ---')
  })

  it('reports correct slide count', async () => {
    const result = await extractPptxText(Buffer.from('fake-pptx'))
    expect(result.slideCount).toBe(2)
  })

  it('extracts title and author from core.xml', async () => {
    const result = await extractPptxText(Buffer.from('fake-pptx'))
    expect(result.info.title).toBe('My Presentation')
    expect(result.info.author).toBe('John')
  })

  it('throws when no slides found', async () => {
    const JSZip = (await import('jszip')).default
    vi.mocked(JSZip.loadAsync).mockResolvedValueOnce({
      files: {},
      file: vi.fn().mockReturnValue(null),
    } as never)

    await expect(extractPptxText(Buffer.from('bad'))).rejects.toThrow(
      'Invalid PPTX file: no slides found'
    )
  })
})
