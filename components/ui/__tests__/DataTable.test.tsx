import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../DataTable'

// ─── Test data ──────────────────────────────────────────────────

interface TestRow {
  id: string
  name: string
  status: string
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
]

const testData: TestRow[] = [
  { id: '1', name: 'Alpha', status: 'Active' },
  { id: '2', name: 'Bravo', status: 'Won' },
  { id: '3', name: 'Charlie', status: 'Active' },
  { id: '4', name: 'Delta', status: 'Lost' },
  { id: '5', name: 'Echo', status: 'Active' },
]

// ─── Tests ──────────────────────────────────────────────────────

describe('DataTable', () => {
  it('renders column headers from config', () => {
    render(<DataTable columns={columns} data={testData} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders all data rows', () => {
    render(<DataTable columns={columns} data={testData} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Delta')).toBeInTheDocument()
    expect(screen.getByText('Echo')).toBeInTheDocument()
  })

  it('shows empty message when data is empty array', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No opportunities found."
      />
    )
    expect(screen.getByText('No opportunities found.')).toBeInTheDocument()
  })

  it('shows default empty message when none provided', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No results found.')).toBeInTheDocument()
  })

  it('renders search input when searchColumn is provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        searchColumn="name"
        searchPlaceholder="Search by name..."
      />
    )
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
  })

  it('does not render search input when searchColumn is omitted', () => {
    render(<DataTable columns={columns} data={testData} />)
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })

  it('filters rows when search input changes', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={testData}
        searchColumn="name"
      />
    )

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'Alpha')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('shows skeleton loading state when isLoading is true', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading={true} loadingRows={3} />
    )
    // Skeletons render as divs with animate-pulse class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('does not render data when loading', () => {
    render(
      <DataTable columns={columns} data={testData} isLoading={true} />
    )
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })

  it('shows row count in pagination', () => {
    render(<DataTable columns={columns} data={testData} />)
    expect(screen.getByText('5 row(s) total')).toBeInTheDocument()
  })

  it('renders custom empty action when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyAction={<button>Create New</button>}
      />
    )
    expect(screen.getByText('Create New')).toBeInTheDocument()
  })

  it('paginates when data exceeds pageSize', () => {
    // Create 30 rows, pageSize=10
    const manyRows: TestRow[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      name: `Row ${i}`,
      status: 'Active',
    }))

    render(<DataTable columns={columns} data={manyRows} pageSize={10} />)

    // First page should show Row 0-9
    expect(screen.getByText('Row 0')).toBeInTheDocument()
    expect(screen.queryByText('Row 10')).not.toBeInTheDocument()

    // Pagination should show page info
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
  })
})
