// [Table – Pagination Fulfillment]
"use client";

// Cùng mẫu categories-pagination.tsx; khác ở chỗ phân trang ở server:
// dòng "Đã chọn x / y" thay bằng tổng số đơn BE trả về (TanStack chỉ thấy các dòng của trang hiện tại).

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PackableOrder } from "@/types/order-flow";

type FulfillmentsPaginationProps = {
  table: Table<PackableOrder>;
  /** Tổng số đơn chờ đóng gói (từ `pagination.total` của BE). */
  total: number;
};

/** Thanh phân trang bảng Đóng hàng: chọn số đơn mỗi trang, số trang, Trước / Tiếp. */
export function FulfillmentsPagination({ table, total }: FulfillmentsPaginationProps) {
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

      <div className="hidden sm:block text-sm text-muted-foreground">Tổng {total} đơn</div>

      <div className="flex items-center space-x-2">
        <span className="hidden sm:block text-sm font-medium">
          Trang{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
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
  );
}
