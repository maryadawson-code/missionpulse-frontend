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

  // pdfjs-dist is externalized via serverComponentsExternalPackages in
  // next.config.mjs so webpack keeps it as a native require() instead of
  // bundling the browser build (which needs DOMMatrix, a browser-only API).
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  try {
    const pages: string[] = []

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .filter((item: Record<string, unknown>) => 'str' in item)
        .map((item: Record<string, unknown>) => item.str as string)
        .join(' ')
      pages.push(pageText)
    }

    const meta = await doc.getMetadata().catch(() => null)

    return {
      text: pages.join('\n'),
      pageCount: doc.numPages,
      info: {
        title: (meta?.info as Record<string, string>)?.Title ?? undefined,
        author: (meta?.info as Record<string, string>)?.Author ?? undefined,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.toLowerCase().includes('password')) {
      throw new Error('This PDF is password-protected and cannot be parsed')
    }
    throw new Error(`Failed to parse PDF: ${message}`)
  } finally {
    await doc.destroy()
  }
}
