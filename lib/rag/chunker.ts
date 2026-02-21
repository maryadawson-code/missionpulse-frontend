/**
 * Semantic Document Chunker
 *
 * Splits documents by structure (headers, sections, paragraphs)
 * instead of fixed token windows. Preserves document hierarchy
 * and metadata for each chunk.
 *
 * Replaces naive fixed-token splitting with structure-aware chunking
 * that respects document boundaries and maintains context.
 */
'use server'

// ─── Types ───────────────────────────────────────────────────

export interface DocumentChunk {
  id: string
  content: string
  metadata: ChunkMetadata
  tokenEstimate: number
}

export interface ChunkMetadata {
  sourceDocId: string
  sourceDocName: string
  sectionTitle: string | null
  sectionLevel: number // 0 = document, 1 = h1, 2 = h2, etc.
  pageNumber: number | null
  chunkIndex: number
  totalChunks: number
  parentSectionTitle: string | null
  documentType: string // 'proposal', 'past_performance', 'playbook', etc.
}

export interface ChunkerConfig {
  maxChunkTokens: number // Target max tokens per chunk (default 512)
  minChunkTokens: number // Minimum tokens to create a chunk (default 50)
  overlapTokens: number // Overlap with previous chunk (default 64)
  respectSectionBoundaries: boolean // Don't split mid-section if under max
}

const DEFAULT_CONFIG: ChunkerConfig = {
  maxChunkTokens: 512,
  minChunkTokens: 50,
  overlapTokens: 64,
  respectSectionBoundaries: true,
}

// ─── Main Chunker ────────────────────────────────────────────

/**
 * Chunk a document semantically based on its structure.
 */
export async function chunkDocument(
  content: string,
  docId: string,
  docName: string,
  documentType: string,
  config: Partial<ChunkerConfig> = {}
): Promise<DocumentChunk[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Parse document into sections
  const sections = parseDocumentSections(content)

  // Generate chunks from sections
  const chunks: DocumentChunk[] = []
  let overlapBuffer = ''

  for (const section of sections) {
    const sectionTokens = estimateTokens(section.content)

    if (sectionTokens <= cfg.maxChunkTokens && cfg.respectSectionBoundaries) {
      // Section fits in one chunk — keep it whole
      if (sectionTokens >= cfg.minChunkTokens) {
        const chunkContent = overlapBuffer
          ? overlapBuffer + '\n\n' + section.content
          : section.content

        chunks.push({
          id: `${docId}_chunk_${chunks.length}`,
          content: chunkContent,
          metadata: {
            sourceDocId: docId,
            sourceDocName: docName,
            sectionTitle: section.title,
            sectionLevel: section.level,
            pageNumber: section.pageEstimate,
            chunkIndex: chunks.length,
            totalChunks: 0, // Updated after all chunks created
            parentSectionTitle: section.parentTitle,
            documentType,
          },
          tokenEstimate: estimateTokens(chunkContent),
        })

        // Set overlap for next chunk
        overlapBuffer = getTrailingText(section.content, cfg.overlapTokens)
      }
    } else {
      // Section too large — split into paragraphs
      const paragraphs = section.content.split(/\n\n+/)
      let currentChunk = overlapBuffer

      for (const para of paragraphs) {
        const paraTokens = estimateTokens(para)
        const currentTokens = estimateTokens(currentChunk)

        if (currentTokens + paraTokens > cfg.maxChunkTokens && currentTokens >= cfg.minChunkTokens) {
          // Flush current chunk
          chunks.push({
            id: `${docId}_chunk_${chunks.length}`,
            content: currentChunk.trim(),
            metadata: {
              sourceDocId: docId,
              sourceDocName: docName,
              sectionTitle: section.title,
              sectionLevel: section.level,
              pageNumber: section.pageEstimate,
              chunkIndex: chunks.length,
              totalChunks: 0,
              parentSectionTitle: section.parentTitle,
              documentType,
            },
            tokenEstimate: estimateTokens(currentChunk),
          })

          // Start new chunk with overlap
          overlapBuffer = getTrailingText(currentChunk, cfg.overlapTokens)
          currentChunk = overlapBuffer + '\n\n' + para
        } else {
          currentChunk = currentChunk ? currentChunk + '\n\n' + para : para
        }
      }

      // Flush remaining content
      if (estimateTokens(currentChunk) >= cfg.minChunkTokens) {
        chunks.push({
          id: `${docId}_chunk_${chunks.length}`,
          content: currentChunk.trim(),
          metadata: {
            sourceDocId: docId,
            sourceDocName: docName,
            sectionTitle: section.title,
            sectionLevel: section.level,
            pageNumber: section.pageEstimate,
            chunkIndex: chunks.length,
            totalChunks: 0,
            parentSectionTitle: section.parentTitle,
            documentType,
          },
          tokenEstimate: estimateTokens(currentChunk),
        })

        overlapBuffer = getTrailingText(currentChunk, cfg.overlapTokens)
      }
    }
  }

  // Update totalChunks
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length
  }

  return chunks
}

// ─── Section Parser ──────────────────────────────────────────

interface ParsedSection {
  title: string | null
  level: number
  content: string
  parentTitle: string | null
  pageEstimate: number | null
}

/**
 * Parse document content into hierarchical sections.
 * Detects markdown headers, numbered sections, and page breaks.
 */
function parseDocumentSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const lines = content.split('\n')

  let currentSection: ParsedSection = {
    title: null,
    level: 0,
    content: '',
    parentTitle: null,
    pageEstimate: 1,
  }

  const headerStack: string[] = [] // Track parent headers
  let estimatedPage = 1
  let linesSincePage = 0

  for (const line of lines) {
    // Check for page breaks
    if (/^---+$/.test(line.trim()) || /^\f/.test(line) || /page\s*\d+/i.test(line.trim())) {
      estimatedPage++
      linesSincePage = 0
    }

    // Check for markdown headers
    const mdMatch = /^(#{1,6})\s+(.+)/.exec(line)
    if (mdMatch) {
      // Flush current section
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection, content: currentSection.content.trim() })
      }

      const level = mdMatch[1].length
      const title = mdMatch[2].trim()

      // Update header stack
      while (headerStack.length >= level) headerStack.pop()
      const parentTitle = headerStack.length > 0 ? headerStack[headerStack.length - 1] : null
      headerStack.push(title)

      currentSection = {
        title,
        level,
        content: '',
        parentTitle,
        pageEstimate: estimatedPage,
      }
      continue
    }

    // Check for numbered section headers (e.g., "1.2 Technical Approach")
    const numMatch = /^(\d+(?:\.\d+)*)\s+([A-Z][A-Za-z\s:]+)/.exec(line)
    if (numMatch && line.length < 100) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection, content: currentSection.content.trim() })
      }

      const level = (numMatch[1].match(/\./g) ?? []).length + 1
      const title = `${numMatch[1]} ${numMatch[2].trim()}`

      const parentTitle = headerStack.length > 0 ? headerStack[headerStack.length - 1] : null
      while (headerStack.length >= level) headerStack.pop()
      headerStack.push(title)

      currentSection = {
        title,
        level,
        content: '',
        parentTitle,
        pageEstimate: estimatedPage,
      }
      continue
    }

    // Regular content line
    currentSection.content += line + '\n'
    linesSincePage++

    // Estimate pages (~50 lines per page)
    if (linesSincePage >= 50) {
      estimatedPage++
      linesSincePage = 0
    }
  }

  // Flush final section
  if (currentSection.content.trim()) {
    sections.push({ ...currentSection, content: currentSection.content.trim() })
  }

  return sections
}

// ─── Utilities ───────────────────────────────────────────────

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Get the trailing N tokens worth of text for overlap.
 */
function getTrailingText(text: string, tokens: number): string {
  const chars = tokens * 4
  if (text.length <= chars) return text

  // Find a clean break point (sentence or paragraph)
  const tail = text.slice(-chars)
  const sentenceBreak = tail.search(/[.!?]\s/)
  if (sentenceBreak > 0) {
    return tail.slice(sentenceBreak + 2)
  }

  return tail
}
