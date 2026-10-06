"use client";

// Tab "Chờ giao": đơn đã đóng gói (PACKED), chờ giao cho đơn vị vận chuyển / shipper.

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { SHIPMENT_PAGE_SIZE } from "@/lib/api/shipment";
import type { HandOverReadyOrder } from "@/types/order-flow";
import { PagedTable, usePagedList, type PageParams } from "./paged-table";

/** Khai báo ngoài component để `usePagedList` nhận một hàm ổn định. */
const loadReadyOrders = (query: PageParams) => orderJourneyApi.listHandOverReady(query.page, query.limit);

/** Cột bảng đơn chờ giao; nút "Giao cho vận chuyển" cần quyền và handler từ trang nên nhận qua tham số. */
function readyOrdersColumns(
  canHandOver: boolean,
  onHandOver: (order: HandOverReadyOrder) => void,
): ColumnDef<HandOverReadyOrder>[] {
  return [
    {
      accessorKey: "code",
      header: "Mã đơn",
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: ({ row }) => row.original.customer.name,
    },
    {
      id: "recipient",
      header: "Người nhận / địa chỉ",
      cell: ({ row }) => (
        <div className="max-w-xs">
          {row.original.recipientName ?? "—"}
          {row.original.recipientPhone && <span className="text-muted-foreground"> · {row.original.recipientPhone}</span>}
          {row.original.deliveryAddress && (
            <span className="block truncate text-xs text-muted-foreground">{row.original.deliveryAddress}</span>
          )}
        </div>
      ),
    },
    {
      id: "branch",
      header: "Chi nhánh",
      cell: ({ row }) => row.original.branch.name,
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) =>
        canHandOver && (
          <Button size="sm" onClick={() => onHandOver(row.original)}>
            Giao cho vận chuyển
          </Button>
        ),
    },
  ];
}

interface ReadyOrdersTabProps {
  reloadKey: number;
  canHandOver: boolean;
  onHandOver: (order: HandOverReadyOrder) => void;
}

/** Bảng đơn chờ giao, phân trang ở server. */
export function ReadyOrdersTab({ reloadKey, canHandOver, onHandOver }: ReadyOrdersTabProps) {
  const [query, setQuery] = useState<PageParams>({ page: 1, limit: SHIPMENT_PAGE_SIZE });
  const state = usePagedList(loadReadyOrders, query, setQuery, reloadKey);
  const columns = useMemo(() => readyOrdersColumns(canHandOver, onHandOver), [canHandOver, onHandOver]);

  return (
    <PagedTable
      state={state}
      query={query}
      onQueryChange={setQuery}
      columns={columns}
      unit="đơn"
      emptyText="Không có đơn nào chờ giao"
      errorText="Không tải được danh sách đơn chờ giao - bấm Tải lại để thử lại"
    />
  );
}
