'use client'

import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Search } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/ui/DataTablePagination'

/** Filter dropdown definition for a specific column */
export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilter {
  /** Column ID to filter on */
  columnId: string
  /** Display label for the filter */
  label: string
  /** Available options */
  options: DataTableFilterOption[]
}

interface DataTableProps<TData, TValue> {
  /** Column definitions from @tanstack/react-table */
  columns: ColumnDef<TData, TValue>[]
  /** Table data */
  data: TData[]
  /** Column ID to use for text search (omit to disable search) */
  searchColumn?: string
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Column filter dropdowns */
  filters?: DataTableFilter[]
  /** Default page size */
  pageSize?: number
  /** Show loading skeleton */
  isLoading?: boolean
  /** Number of skeleton rows to show while loading */
  loadingRows?: number
  /** Message when table is empty */
  emptyMessage?: string
  /** Optional CTA element for empty state */
  emptyAction?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search...',
  filters = [],
  pageSize = 25,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = 'No results found.',
  emptyAction,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: { pageSize },
    },
  })

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[250px]" />
          {filters.map((f) => (
            <Skeleton key={f.columnId} className="h-10 w-[150px]" />
          ))}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: loadingRows }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filters */}
      {(searchColumn || filters.length > 0) && (
        <div className="flex flex-wrap items-center gap-4">
          {searchColumn && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table
                    .getColumn(searchColumn)
                    ?.getFilterValue() as string) ?? ''
                }
                onChange={(event) =>
                  table
                    .getColumn(searchColumn)
                    ?.setFilterValue(event.target.value)
                }
                className="pl-9"
              />
            </div>
          )}
          {filters.map((filter) => (
            <Select
              key={filter.columnId}
              value={
                (table
                  .getColumn(filter.columnId)
                  ?.getFilterValue() as string) ?? '__all__'
              }
              onValueChange={(value) =>
                table
                  .getColumn(filter.columnId)
                  ?.setFilterValue(value === '__all__' ? undefined : value)
              }
            >
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const ariaSort = sorted === 'asc'
                    ? 'ascending' as const
                    : sorted === 'desc'
                      ? 'descending' as const
                      : undefined
                  return (
                  <TableHead key={header.id} aria-sort={ariaSort} scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                    {emptyAction}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
