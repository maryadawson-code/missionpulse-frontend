'use server'

import JSZip from 'jszip'

export interface ParsedPresentation {
  text: string
  slideCount: number
  info: {
    title?: string
    author?: string
  }
}

/**
 * Extract text from a PPTX file using jszip.
 * PPTX files are ZIP archives containing XML slides —
 * we read ppt/slides/slide*.xml and extract text from <a:t> elements.
 */
export async function extractPptxText(buffer: Buffer): Promise<ParsedPresentation> {
  const zip = await JSZip.loadAsync(buffer)

  // Find all slide files and sort them numerically
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0')
      return numA - numB
    })

  if (slideFiles.length === 0) {
    throw new Error('Invalid PPTX file: no slides found')
  }

  const paragraphs: string[] = []

  for (const slidePath of slideFiles) {
    const slideNum = slidePath.match(/slide(\d+)/)?.[1] ?? '?'
    paragraphs.push(`--- Slide ${slideNum} ---`)

    const slideXml = await zip.file(slidePath)?.async('string')
    if (!slideXml) continue

    // Extract text from <a:t> tags within <a:p> paragraphs
    const pRegex = /<a:p\b[^>]*>[\s\S]*?<\/a:p>/g
    let pMatch: RegExpExecArray | null
    while ((pMatch = pRegex.exec(slideXml)) !== null) {
      const pXml = pMatch[0]
      const textParts: string[] = []
      const tRegex = /<a:t>([\s\S]*?)<\/a:t>/g
      let tMatch: RegExpExecArray | null
      while ((tMatch = tRegex.exec(pXml)) !== null) {
        textParts.push(tMatch[1])
      }
      if (textParts.length > 0) {
        paragraphs.push(textParts.join(''))
      }
    }
  }

  // Try to extract core properties
  let title: string | undefined
  let author: string | undefined

  const coreXml = zip.file('docProps/core.xml')
  if (coreXml) {
    const coreContent = await coreXml.async('string')
    const titleMatch = /<dc:title>([\s\S]*?)<\/dc:title>/.exec(coreContent)
    if (titleMatch) title = titleMatch[1].trim() || undefined
    const authorMatch = /<dc:creator>([\s\S]*?)<\/dc:creator>/.exec(coreContent)
    if (authorMatch) author = authorMatch[1].trim() || undefined
  }

  return {
    text: paragraphs.join('\n'),
    slideCount: slideFiles.length,
    info: { title, author },
  }
}
