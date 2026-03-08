import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCSV } from '@/lib/utils/export'

describe('exportToCSV', () => {
  let mockClick: ReturnType<typeof vi.fn>
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockClick = vi.fn()
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
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

  it('creates CSV with headers and rows', () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]
    const columns = [
      { header: 'Name', accessor: (r: typeof rows[0]) => r.name },
      { header: 'Age', accessor: (r: typeof rows[0]) => r.age },
    ]

    exportToCSV(rows, columns, 'test.csv')

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })

  it('escapes double quotes in values', () => {
    const rows = [{ text: 'He said "hello"' }]
    const columns = [
      { header: 'Text', accessor: (r: typeof rows[0]) => r.text },
    ]

    exportToCSV(rows, columns, 'test.csv')
    expect(mockClick).toHaveBeenCalled()
  })

  it('handles null/undefined values', () => {
    const rows = [{ val: null as string | null }]
    const columns = [
      { header: 'Val', accessor: (r: typeof rows[0]) => r.val },
    ]

    exportToCSV(rows, columns, 'test.csv')
    expect(mockClick).toHaveBeenCalled()
  })

  it('handles empty rows', () => {
    const columns = [
      { header: 'Name', accessor: (_r: Record<string, never>) => '' },
    ]

    exportToCSV([], columns, 'test.csv')
    expect(mockClick).toHaveBeenCalled()
  })
})
