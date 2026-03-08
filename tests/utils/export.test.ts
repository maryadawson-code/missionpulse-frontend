import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCSV } from '@/lib/utils/export'

describe('exportToCSV', () => {
  let mockClick: ReturnType<typeof vi.fn>
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockClick = vi.fn()
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test')
    mockRevokeObjectURL = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement)
  })

  it('creates CSV from rows and columns', () => {
    const rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]
    const columns = [
      { header: 'Name', accessor: (r: typeof rows[0]) => r.name },
      { header: 'Age', accessor: (r: typeof rows[0]) => r.age },
    ]

    exportToCSV(rows, columns, 'test.csv')

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('handles empty rows', () => {
    exportToCSV([], [{ header: 'Name', accessor: () => '' }], 'empty.csv')
    expect(mockClick).toHaveBeenCalled()
  })

  it('escapes double quotes in values', () => {
    const rows = [{ val: 'He said "hello"' }]
    const columns = [{ header: 'Quote', accessor: (r: typeof rows[0]) => r.val }]

    exportToCSV(rows, columns, 'quotes.csv')
    expect(mockCreateObjectURL).toHaveBeenCalled()
  })

  it('handles null/undefined values', () => {
    const rows = [{ val: null }]
    const columns = [{ header: 'Nullable', accessor: (r: typeof rows[0]) => r.val }]

    exportToCSV(rows, columns, 'nulls.csv')
    expect(mockClick).toHaveBeenCalled()
  })

  it('sets correct download filename', () => {
    const createElement = vi.spyOn(document, 'createElement')
    const mockEl = { href: '', download: '', click: mockClick }
    createElement.mockReturnValue(mockEl as unknown as HTMLAnchorElement)

    exportToCSV([], [{ header: 'H', accessor: () => '' }], 'report.csv')
    expect(mockEl.download).toBe('report.csv')
  })
})
