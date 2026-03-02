/**
 * Shredder Actions — Module integrity tests
 *
 * These tests verify that the shredder actions module loads correctly.
 * The primary risk is that top-level imports of heavy dependencies
 * (pdf-parse, exceljs, jszip) crash the entire module on Vercel's
 * serverless runtime. All parser imports must be lazy (dynamic import).
 */
import { describe, it, expect, vi } from 'vitest'

// Mock server-only modules before any action imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('Shredder actions module', () => {
  it('can be imported without throwing', async () => {
    // This is the critical test — if top-level imports of heavy
    // dependencies like pdf-parse/exceljs/jszip fail, the import
    // itself throws and all exports become undefined.
    const actions = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(actions).toBeDefined()
  })

  it('exports getStorageUploadInfo', async () => {
    const { getStorageUploadInfo } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof getStorageUploadInfo).toBe('function')
  })

  it('exports processStoredFile', async () => {
    const { processStoredFile } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof processStoredFile).toBe('function')
  })

  it('exports processStoredZip', async () => {
    const { processStoredZip } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof processStoredZip).toBe('function')
  })

  it('exports deleteRfpDocument', async () => {
    const { deleteRfpDocument } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof deleteRfpDocument).toBe('function')
  })
})

describe('Shredder parser modules', () => {
  it('pdf-parser can be dynamically imported', async () => {
    const mod = await import('@/lib/utils/pdf-parser')
    expect(typeof mod.extractPdfText).toBe('function')
  })

  it('docx-parser can be dynamically imported', async () => {
    const mod = await import('@/lib/utils/docx-parser')
    expect(typeof mod.extractDocxText).toBe('function')
  })

  it('xlsx-text-extractor can be dynamically imported', async () => {
    const mod = await import('@/lib/utils/xlsx-text-extractor')
    expect(typeof mod.extractXlsxText).toBe('function')
  })

  it('pptx-parser can be dynamically imported', async () => {
    const mod = await import('@/lib/utils/pptx-parser')
    expect(typeof mod.extractPptxText).toBe('function')
  })
})
