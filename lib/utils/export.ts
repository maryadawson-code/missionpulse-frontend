/**
 * Reusable CSV export utility.
 * Escapes values per RFC 4180 and triggers a browser download.
 */

interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number | null | undefined
}

export function exportToCSV<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const headers = columns.map((c) => c.header)
  const csvRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = String(col.accessor(row) ?? '')
        // Escape double quotes and wrap in quotes
        return `"${val.replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csv = [headers.join(','), ...csvRows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
