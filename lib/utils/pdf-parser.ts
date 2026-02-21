'use server'

import { PDFParse } from 'pdf-parse'

export interface ParsedPDF {
  text: string
  pageCount: number
  info: {
    title?: string
    author?: string
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function extractPdfText(buffer: Buffer): Promise<ParsedPDF> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 50MB')
  }

  let parser: PDFParse | null = null

  try {
    parser = new PDFParse({ data: new Uint8Array(buffer) })

    const textResult = await parser.getText()
    const infoResult = await parser.getInfo()

    return {
      text: textResult.text,
      pageCount: textResult.pages?.length ?? 0,
      info: {
        title: infoResult.info?.Title ?? undefined,
        author: infoResult.info?.Author ?? undefined,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.toLowerCase().includes('password')) {
      throw new Error('This PDF is password-protected and cannot be parsed')
    }
    throw new Error(`Failed to parse PDF: ${message}`)
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {})
    }
  }
}
