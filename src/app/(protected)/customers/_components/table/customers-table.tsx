// [Table – Orchestrator Customer]
'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableEmpty } from '@/components/data-table/data-table-empty'
import { DataTableLoading } from '@/components/data-table/data-table-loading'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { cn } from '@/lib/utils'
import { useCustomers } from '../../_context/customers-provider'
import { customersColumns } from './customers-columns'
import { CustomersToolbar } from './customers-toolbar'
import { CustomersExpandedPanel } from './customers-expanded-panel'

export function CustomersTable() {
  const { customers, isLoading, setSelectedIds, selectionVersion } = useCustomers()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [spendingFrom, setSpendingFrom] = useState('')
  const [spendingTo, setSpendingTo] = useState('')

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        if (dateFrom && c.createdAt < dateFrom) return false
        if (dateTo && c.createdAt > dateTo) return false

        const totalSpending = c.orders
          .filter((o) => o.status === 'COMPLETED')
          .reduce((sum, o) => sum + o.grandTotal, 0)

        if (spendingFrom !== '' && totalSpending < Number(spendingFrom)) return false
        if (spendingTo !== '' && totalSpending > Number(spendingTo)) return false

        return true
      }),
    [customers, dateFrom, dateTo, spendingFrom, spendingTo],
  )

  const table = useReactTable({
    data: filteredCustomers,
    columns: customersColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    // The phone number is drawn under the name rather than in its own column, so the
    // default global filter (which only reads column values) could never match it.
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const needle = String(filterValue ?? '').trim().toLowerCase()
      if (!needle) return true
      const c = row.original
      return [c.name, c.phone, c.customerCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    },
    onExpandedChange: setExpanded,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      expanded,
    },
  })

  useEffect(() => {
    const ids = table.getFilteredSelectedRowModel().rows.map((r) => r.original.id)
    setSelectedIds(ids)
  }, [rowSelection, table, setSelectedIds])

  useEffect(() => {
    if (selectionVersion > 0) setRowSelection({})
  }, [selectionVersion])

  const rows = table.getRowModel().rows
  const columnCount = table.getVisibleLeafColumns().length
  // Skeleton chỉ khi chưa có dữ liệu nào; lúc thêm/sửa/xoá (cũng bật isLoading) vẫn giữ các dòng cũ.
  const showLoading = isLoading && customers.length === 0

  return (
    <div className="space-y-4">
      <CustomersToolbar
        table={table}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        spendingFrom={spendingFrom}
        spendingTo={spendingTo}
        onSpendingFromChange={setSpendingFrom}
        onSpendingToChange={setSpendingTo}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showLoading && <DataTableLoading columnCount={columnCount} />}
            {!showLoading && rows.length === 0 && <DataTableEmpty columnCount={columnCount} />}
            {!showLoading &&
              rows.map((row, index) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      'cursor-pointer',
                      index === rows.length - 1 && 'border-b-0',
                      row.getIsExpanded() &&
                        'bg-primary/15 shadow-[inset_0_1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={
                          cell.column.id === 'select' ? (e) => e.stopPropagation() : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow
                    className={cn(
                      'hover:bg-transparent transition-colors duration-300 border-transparent',
                      row.getIsExpanded() &&
                        'shadow-[inset_0_-1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]',
                    )}
                  >
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                      <div
                        className={cn(
                          'sticky left-0 w-[100cqw] grid transition-[grid-template-rows] duration-300 ease-in-out',
                          row.getIsExpanded() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <CustomersExpandedPanel
                            customer={row.original}
                            isExpanded={row.getIsExpanded()}
                            isLastRow={index === rows.length - 1}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        pageSize={table.getState().pagination.pageSize}
        total={table.getFilteredRowModel().rows.length}
        unit="khách hàng"
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(pageSize) => {
          table.setPageSize(pageSize)
          table.setPageIndex(0)
        }}
      />
    </div>
  )
}
