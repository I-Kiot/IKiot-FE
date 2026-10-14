// [Table – Orchestrator Shipment]
"use client";

// Bảng phân trang ở server dùng chung cho hai tab của màn Giao hàng: hook tải dữ liệu (`usePagedList`),
// bảng TanStack `manualPagination` (`PagedTable`) và thanh phân trang dùng chung.

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
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

// ─── Bảng ───────────────────────────────────────────────────────────────────

interface PagedTableProps<T extends { id: string }, Q extends PageParams> {
  state: PagedState<T>;
  query: Q;
  onQueryChange: (query: Q) => void;
  columns: ColumnDef<T>[];
  /** Đơn vị đếm ở thanh phân trang, vd. "đơn". */
  unit: string;
  errorText: string;
  onRowClick?: (row: T) => void;
}

/** Bảng + thanh phân trang. Không tự tải dữ liệu – nơi gọi dùng `usePagedList`. */
export function PagedTable<T extends { id: string }, Q extends PageParams>({
  state,
  query,
  onQueryChange,
  columns,
  unit,
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

  const columnCount = columns.length;
  const rows = table.getRowModel().rows;

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
            {state.status === "loading" && <DataTableLoading columnCount={columnCount} />}
            {state.status === "error" && (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-8 text-center text-muted-foreground">
                  {errorText}
                </TableCell>
              </TableRow>
            )}
            {state.status === "ready" && rows.length === 0 && <DataTableEmpty columnCount={columnCount} />}
            {state.status === "ready" &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {result && result.pagination.total > 0 && (
        <DataTablePagination
          page={query.page}
          pageCount={result.pagination.totalPages}
          pageSize={query.limit}
          total={result.pagination.total}
          unit={unit}
          onPageChange={(page) => onQueryChange({ ...query, page })}
          onPageSizeChange={(limit) => onQueryChange({ ...query, page: 1, limit })}
        />
      )}
    </div>
  );
}
