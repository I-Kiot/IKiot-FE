// [Table – Orchestrator Fulfillment]
"use client";

// Bảng Đóng hàng bằng TanStack Table cho đồng bộ với các màn khác.
// Phân trang ở server (`manualPagination`), cùng cách staffs-table.tsx làm.

import { useMemo } from "react";
import { flexRender, getCoreRowModel, type PaginationState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PackableOrder, Paginated } from "@/types/order-flow";
import { fulfillmentsColumns } from "./fulfillments-columns";
import { FulfillmentsPagination } from "./fulfillments-pagination";

/** Trang và số đơn mỗi trang đang xem - trang cha giữ, đổi là tải lại. */
export type PackListQuery = { page: number; limit: number };

/** Tình trạng danh sách: đang tải lần đầu, tải lỗi, hoặc đã có một trang đơn. */
export type PackListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; result: Paginated<PackableOrder> };

/** Câu hiện thay cho các dòng khi chưa có gì để vẽ; `null` = vẽ các dòng. */
function placeholderOf(state: PackListState, rowCount: number): string | null {
  if (state.status === "loading") return "Đang tải...";
  if (state.status === "error") return "Không tải được danh sách đơn chờ đóng gói - bấm Tải lại để thử lại";
  if (rowCount === 0) return "Không có đơn nào chờ đóng gói";
  return null;
}

interface FulfillmentsTableProps {
  state: PackListState;
  query: PackListQuery;
  onQueryChange: (query: PackListQuery) => void;
  canPack: boolean;
  onPack: (order: PackableOrder) => void;
}

/** Bảng đơn CONFIRMED chờ đóng gói, kèm thanh phân trang. Không tự tải dữ liệu - trang cha làm. */
export function FulfillmentsTable({ state, query, onQueryChange, canPack, onPack }: FulfillmentsTableProps) {
  const columns = useMemo(() => fulfillmentsColumns({ canPack, onPack }), [canPack, onPack]);
  const pagination: PaginationState = { pageIndex: query.page - 1, pageSize: query.limit };
  const result = state.status === "ready" ? state.result : null;

  const table = useReactTable({
    data: result?.data ?? [],
    columns,
    pageCount: result?.pagination.totalPages ?? -1,
    manualPagination: true,
    getRowId: (order) => order.id,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      // Đổi số đơn mỗi trang → về trang 1, đặt cả hai trong MỘT lần để không gọi BE cho một trang không còn tồn tại.
      onQueryChange(
        next.pageSize !== query.limit
          ? { page: 1, limit: next.pageSize }
          : { page: next.pageIndex + 1, limit: query.limit },
      );
    },
  });

  const colSpan = columns.length;
  const placeholder = placeholderOf(state, table.getRowModel().rows.length);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === "actions" ? "w-[120px]" : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {placeholder !== null ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
                  {placeholder}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
        <FulfillmentsPagination table={table} total={result.pagination.total} />
      )}
    </div>
  );
}
