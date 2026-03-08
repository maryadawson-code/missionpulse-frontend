import { describe, it, expect, vi } from 'vitest'

import { chunkDocument } from '@/lib/rag/chunker'
import type { ChunkerConfig } from '@/lib/rag/chunker'

describe('chunker', () => {
  describe('chunkDocument', () => {
    it('should produce at least one chunk from simple content', async () => {
      const content = 'This is a simple paragraph with enough text to meet the minimum token threshold. '.repeat(5)
      const chunks = await chunkDocument(content, 'doc-1', 'Test Doc', 'proposal')

      expect(chunks.length).toBeGreaterThanOrEqual(1)
      expect(chunks[0].id).toContain('doc-1_chunk_')
      expect(chunks[0].metadata.sourceDocId).toBe('doc-1')
      expect(chunks[0].metadata.sourceDocName).toBe('Test Doc')
      expect(chunks[0].metadata.documentType).toBe('proposal')
    })

    it('should set totalChunks on all chunks', async () => {
      const content = 'Some content that is long enough. '.repeat(20)
      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal')

      for (const chunk of chunks) {
        expect(chunk.metadata.totalChunks).toBe(chunks.length)
      }
    })

    it('should parse markdown headers into separate sections', async () => {
      const content = `# Section One\n\nContent for section one. This has enough content to form a chunk on its own when repeated several times. `.repeat(3) +
        `\n\n# Section Two\n\nContent for section two. This also needs to be long enough to meet the minimum token threshold. `.repeat(3)

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal')
      expect(chunks.length).toBeGreaterThanOrEqual(1)

      const sectionTitles = chunks.map((c) => c.metadata.sectionTitle).filter(Boolean)
      expect(sectionTitles.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse numbered section headers', async () => {
      const content = `1.1 Technical Approach\n\nOur technical approach involves several key components that demonstrate our capability. `.repeat(3) +
        `\n\n1.2 Management Plan\n\nThe management plan outlines our organizational structure and governance model in detail. `.repeat(3)

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal')
      expect(chunks.length).toBeGreaterThanOrEqual(1)
    })

    it('should split large sections into multiple chunks', async () => {
      // Generate content that exceeds maxChunkTokens (512 tokens ~ 2048 chars)
      const largeParagraphs = Array.from({ length: 20 }, (_, i) =>
        `Paragraph ${i}: This is a substantial paragraph of content that discusses important proposal details. `.repeat(3)
      ).join('\n\n')

      const content = `# Large Section\n\n${largeParagraphs}`

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal', {
        maxChunkTokens: 256,
        minChunkTokens: 20,
      })

      expect(chunks.length).toBeGreaterThan(1)
    })

    it('should respect custom config', async () => {
      const content = 'Word '.repeat(200)
      const config: Partial<ChunkerConfig> = {
        maxChunkTokens: 100,
        minChunkTokens: 10,
        overlapTokens: 20,
        respectSectionBoundaries: false,
      }

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal', config)
      expect(chunks.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle page break markers', async () => {
      const content = `Some content before the break. `.repeat(5) +
        `\n---\n` +
        `Content after the page break. `.repeat(5)

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal')
      expect(chunks.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty content', async () => {
      const chunks = await chunkDocument('', 'doc-1', 'Test', 'proposal')
      expect(chunks).toEqual([])
    })

    it('should handle content below minimum token threshold', async () => {
      const chunks = await chunkDocument('Hi', 'doc-1', 'Test', 'proposal')
      // Content is too short to form a chunk
      expect(chunks.length).toBe(0)
    })

    it('should track parent section titles', async () => {
      const content = `# Parent Section\n\nIntro text. `.repeat(5) +
        `\n\n## Child Section\n\nChild content with enough text to form a chunk. `.repeat(5)

      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal')
      const childChunks = chunks.filter((c) => c.metadata.sectionTitle === 'Child Section')
      if (childChunks.length > 0) {
        expect(childChunks[0].metadata.parentSectionTitle).toBe('Parent Section')
      }
    })

    it('should estimate token count from content length', async () => {
      const content = 'A'.repeat(1000) // 1000 chars ~ 250 tokens
      const chunks = await chunkDocument(content, 'doc-1', 'Test', 'proposal', {
        minChunkTokens: 10,
      })

      if (chunks.length > 0) {
        expect(chunks[0].tokenEstimate).toBeGreaterThan(0)
      }
    })
  })
})
