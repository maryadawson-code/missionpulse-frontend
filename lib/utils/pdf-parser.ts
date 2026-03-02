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

  // Use pdfjs-dist legacy build directly — avoids @napi-rs/canvas native
  // dependency that breaks inside Next.js webpack-bundled server actions.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  try {
    const pages: string[] = []

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
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
