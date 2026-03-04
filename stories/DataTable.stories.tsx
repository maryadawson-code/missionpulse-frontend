import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable'

interface SampleRow {
  id: string
  name: string
  status: string
  value: number
}

const sampleColumns: ColumnDef<SampleRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => `$${row.original.value.toLocaleString()}`,
  },
]

const sampleData: SampleRow[] = [
  { id: '1', name: 'Project Alpha', status: 'Active', value: 150000 },
  { id: '2', name: 'Project Beta', status: 'Won', value: 250000 },
  { id: '3', name: 'Project Gamma', status: 'Draft', value: 75000 },
  { id: '4', name: 'Project Delta', status: 'Lost', value: 500000 },
  { id: '5', name: 'Project Epsilon', status: 'Active', value: 320000 },
]

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: sampleColumns as ColumnDef<unknown>[],
    data: sampleData,
  },
}

export const WithSearch: Story = {
  args: {
    columns: sampleColumns as ColumnDef<unknown>[],
    data: sampleData,
    searchColumn: 'name',
    searchPlaceholder: 'Search projects...',
  },
}

export const Empty: Story = {
  args: {
    columns: sampleColumns as ColumnDef<unknown>[],
    data: [],
  },
}
