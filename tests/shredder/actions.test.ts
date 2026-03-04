/**
 * Shredder Actions — Module integrity tests
 *
 * Verifies that the shredder actions module loads correctly and all
 * exports are available. Critical because top-level import failures
 * crash the entire page.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('Shredder actions module', () => {
  it('can be imported without throwing', async () => {
    const actions = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(actions).toBeDefined()
  })

  it('exports uploadRfpFile', async () => {
    const { uploadRfpFile } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof uploadRfpFile).toBe('function')
  })

  it('exports uploadRfpZip', async () => {
    const { uploadRfpZip } = await import(
      '@/app/(dashboard)/pipeline/[id]/shredder/actions'
    )
    expect(typeof uploadRfpZip).toBe('function')
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
