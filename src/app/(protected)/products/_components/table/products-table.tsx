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
import { cn } from '@/lib/utils'
import { parseLocationKey } from '@/lib/location-key'
import { useAuthStore } from '@/store/auth-store'
import { useProducts } from '../../_context/products-provider'
import { getProductsColumns } from './products-columns'
import { ProductsToolbar } from './products-toolbar'
import { ProductsPagination } from './products-pagination'
import { ProductsExpandedPanel } from './products-expanded-panel'
import { ProductsEmpty } from '../products-empty'

export function ProductsTable() {
  const { products, setSelectedIds, selectionVersion, brands, categories, skuSearchIndex } =
    useProducts()
  const locationKey = useAuthStore((state) => state.locationKey)
  const isLocationScoped = parseLocationKey(locationKey) !== null
  const columns = useMemo(
    () => getProductsColumns(brands, categories, isLocationScoped),
    [brands, categories, isLocationScoped],
  )

  const [sorting, setSorting] = useState<SortingState>([{ id: 'status', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
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
    // Default global filter only sees column values on `Product` rows, which never
    // carry sku/productCode - match those via the pre-built skuSearchIndex instead.
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue ?? '').trim().toLowerCase()
      if (!term) return true
      if (row.original.name.toLowerCase().includes(term)) return true
      return (skuSearchIndex.get(row.original.id) ?? '').includes(term)
    },
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
      <ProductsToolbar table={table} />

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
                          <ProductsExpandedPanel
                            product={row.original}
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
                <TableCell colSpan={columns.length}>
                  <ProductsEmpty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductsPagination table={table} />
    </div>
  )
}
