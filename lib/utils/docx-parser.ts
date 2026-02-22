'use server'

import JSZip from 'jszip'

export interface ParsedDocument {
  text: string
  pageCount: number
  info: {
    title?: string
    author?: string
  }
}

/**
 * Extract text from a DOCX file using jszip.
 * DOCX files are ZIP archives containing XML — we read word/document.xml
 * and extract text from <w:t> elements.
 */
export async function extractDocxText(buffer: Buffer): Promise<ParsedDocument> {
  const zip = await JSZip.loadAsync(buffer)

  const docXml = zip.file('word/document.xml')
  if (!docXml) {
    throw new Error('Invalid DOCX file: missing word/document.xml')
  }

  const xmlContent = await docXml.async('string')

  // Extract text from <w:t> tags, preserving paragraph breaks
  const paragraphs: string[] = []
  // Split by paragraph markers <w:p ...>...</w:p>
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g
  let pMatch: RegExpExecArray | null
  while ((pMatch = pRegex.exec(xmlContent)) !== null) {
    const pXml = pMatch[0]
    // Extract all <w:t ...>text</w:t> within this paragraph
    const textParts: string[] = []
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
    let tMatch: RegExpExecArray | null
    while ((tMatch = tRegex.exec(pXml)) !== null) {
      textParts.push(tMatch[1])
    }
    if (textParts.length > 0) {
      paragraphs.push(textParts.join(''))
    }
  }

  const text = paragraphs.join('\n')

  // Try to extract core properties (title, author)
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
    text,
    pageCount: 0, // DOCX doesn't have a reliable page count without rendering
    info: { title, author },
  }
}
