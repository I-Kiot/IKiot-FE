// [Table – Orchestrator Promotion]
'use client'

import { Fragment, useEffect, useState } from 'react'
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
import { cn } from '@/lib/utils'
import { usePromotions } from '../../_context/promotions-provider'
import { promotionsColumns } from './promotions-columns'
import { PromotionsToolbar } from './promotions-toolbar'
import { PromotionsPagination } from './promotions-pagination'
import { PromotionsExpandedPanel } from './promotions-expanded-panel'
import { PromotionsEmpty } from '../promotions-empty'

export function PromotionsTable() {
  const { promotions, setSelectedIds, selectionVersion } = usePromotions()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data: promotions,
    columns: promotionsColumns,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      return row.original.promoName.toLowerCase().includes(search)
    },
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

  return (
    <div className="space-y-4">
      <PromotionsToolbar table={table} />

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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, rows) => (
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
                          'grid transition-[grid-template-rows] duration-300 ease-in-out',
                          row.getIsExpanded() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <PromotionsExpandedPanel
                            promotion={row.original}
                            isExpanded={row.getIsExpanded()}
                            isLastRow={index === rows.length - 1}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={promotionsColumns.length}>
                  <PromotionsEmpty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PromotionsPagination table={table} />
    </div>
  )
}
