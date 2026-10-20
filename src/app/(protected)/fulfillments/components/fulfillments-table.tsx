// [Table – Orchestrator Fulfillment]
"use client";

// Bảng Đóng hàng bằng TanStack Table cho đồng bộ với các màn khác.
// Phân trang ở server (`manualPagination`), cùng cách staffs-table.tsx làm.

import { useMemo } from "react";
import { flexRender, getCoreRowModel, type PaginationState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PackableOrder, Paginated } from "@/types/order-flow";
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { fulfillmentsColumns } from "./fulfillments-columns";

/** Trang và số đơn mỗi trang đang xem - trang cha giữ, đổi là tải lại. */
export type PackListQuery = { page: number; limit: number };

/** Tình trạng danh sách: đang tải lần đầu, tải lỗi, hoặc đã có một trang đơn. */
export type PackListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; result: Paginated<PackableOrder> };

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
                  <TableHead key={header.id} className={header.column.id === "actions" ? "w-[120px]" : undefined}>
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
                  Không tải được danh sách đơn chờ đóng gói - bấm Tải lại để thử lại
                </TableCell>
              </TableRow>
            )}
            {state.status === "ready" && rows.length === 0 && <DataTableEmpty columnCount={columnCount} />}
            {state.status === "ready" &&
              rows.map((row) => (
                <TableRow key={row.id}>
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
          unit="đơn"
          onPageChange={(page) => onQueryChange({ page, limit: query.limit })}
          onPageSizeChange={(limit) => onQueryChange({ page: 1, limit })}
        />
      )}
    </div>
  );
}
