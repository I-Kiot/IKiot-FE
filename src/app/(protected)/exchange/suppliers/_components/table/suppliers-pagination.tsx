// [Table – Pagination Supplier]
'use client'

import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Supplier } from '@/types/supplier'

type SuppliersPaginationProps = {
  table: Table<Supplier>
}

export function SuppliersPagination({ table }: SuppliersPaginationProps) {
  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="flex items-center space-x-2">
        <Label className="text-sm font-medium">Hiển thị</Label>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="w-20 cursor-pointer">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden sm:block text-sm text-muted-foreground">
        Đã chọn {table.getFilteredSelectedRowModel().rows.length} /{' '}
        {table.getFilteredRowModel().rows.length} nhà cung cấp
      </div>

      <div className="flex items-center space-x-2">
        <span className="hidden sm:block text-sm font-medium">
          Trang{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="cursor-pointer"
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="cursor-pointer"
        >
          Tiếp
        </Button>
      </div>
    </div>
  )
}
