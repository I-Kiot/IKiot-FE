// [Table – Orchestrator Shipment]
"use client";

// Bảng phân trang ở server dùng chung cho hai tab của màn Giao hàng: hook tải dữ liệu (`usePagedList`),
// bảng TanStack `manualPagination` (`PagedTable`) và thanh phân trang – cùng cách màn Đóng hàng làm.

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type PaginationState,
  type Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/order-flow";

// ─── Tải dữ liệu ────────────────────────────────────────────────────────────

/** Tình trạng danh sách: đang tải lần đầu, tải lỗi, hoặc đã có một trang. */
export type PagedState<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; result: Paginated<T> };

/** Trang và số dòng mỗi trang đang xem; mỗi bảng cộng thêm bộ lọc riêng. */
export type PageParams = { page: number; limit: number };

/**
 * Tải trang `query` mỗi khi query hoặc `reloadKey` đổi. `load` phải ổn định (khai báo ngoài component).
 * - Response của lần gọi cũ về sau thì bỏ, không đè lên trang đang xem.
 * - Trang hiện tại rỗng mà không phải trang 1 (vd. vừa xử lý dòng cuối của trang cuối) → lùi về trang
 *   cuối còn dữ liệu; effect tự chạy lại.
 * Mỗi nhánh của `.then()` chỉ gọi một setter (lint cấm setState trong useEffect).
 */
export function usePagedList<T, Q extends PageParams>(
  load: (query: Q) => Promise<Paginated<T>>,
  query: Q,
  setQuery: (query: Q) => void,
  reloadKey: number,
): PagedState<T> {
  const [state, setState] = useState<PagedState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    load(query).then(
      (result) => {
        if (cancelled) return;
        if (result.data.length === 0 && query.page > 1) {
          setQuery({ ...query, page: Math.max(1, result.pagination.totalPages) });
        } else {
          setState({ status: "ready", result });
        }
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, query, setQuery, reloadKey]);

  return state;
}

// ─── Thanh phân trang ───────────────────────────────────────────────────────

/**
 * Cùng mẫu categories-pagination.tsx; khác ở chỗ phân trang ở server: dòng "Đã chọn x / y" thay bằng
 * tổng số BE trả về (TanStack chỉ thấy các dòng của trang hiện tại).
 */
function Pagination<TData>({ table, total, unit }: { table: TanstackTable<TData>; total: number; unit: string }) {
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
        Tổng {total} {unit}
      </div>

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

// ─── Bảng ───────────────────────────────────────────────────────────────────

interface PagedTableProps<T extends { id: string }, Q extends PageParams> {
  state: PagedState<T>;
  query: Q;
  onQueryChange: (query: Q) => void;
  columns: ColumnDef<T>[];
  /** Đơn vị đếm ở thanh phân trang, vd. "đơn". */
  unit: string;
  emptyText: string;
  errorText: string;
  onRowClick?: (row: T) => void;
}

/** Câu hiện thay cho các dòng khi chưa có gì để vẽ; `null` = vẽ các dòng. */
function placeholderOf<T>(state: PagedState<T>, rowCount: number, emptyText: string, errorText: string) {
  if (state.status === "loading") return "Đang tải...";
  if (state.status === "error") return errorText;
  if (rowCount === 0) return emptyText;
  return null;
}

/** Bảng + thanh phân trang. Không tự tải dữ liệu – nơi gọi dùng `usePagedList`. */
export function PagedTable<T extends { id: string }, Q extends PageParams>({
  state,
  query,
  onQueryChange,
  columns,
  unit,
  emptyText,
  errorText,
  onRowClick,
}: PagedTableProps<T, Q>) {
  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.limit };
  const result = state.status === "ready" ? state.result : null;

  const table = useReactTable({
    data: result?.data ?? [],
    columns,
    pageCount: result?.pagination.totalPages ?? -1,
    manualPagination: true,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      // Đổi số dòng mỗi trang → về trang 1, đặt cả hai trong MỘT lần để không gọi BE cho một trang không còn tồn tại.
      onQueryChange(
        next.pageSize !== query.limit
          ? { ...query, page: 1, limit: next.pageSize }
          : { ...query, page: next.pageIndex + 1 },
      );
    },
  });

  const placeholder = placeholderOf(state, table.getRowModel().rows.length, emptyText, errorText);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {placeholder !== null ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  {placeholder}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {result && result.pagination.total > 0 && (
        <Pagination table={table} total={result.pagination.total} unit={unit} />
      )}
    </div>
  );
}
