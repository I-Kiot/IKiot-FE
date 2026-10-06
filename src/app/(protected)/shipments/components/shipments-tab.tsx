"use client";

// Tab "Lần giao": thanh lọc (trạng thái, hình thức, khoảng ngày, tìm kiếm) và bảng các lần giao; bấm một
// dòng để mở chi tiết.

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shipmentApi, SHIPMENT_PAGE_SIZE } from "@/lib/api/shipment";
import {
  personName,
  SHIPMENT_STATUS_LABELS,
  type CarrierType,
  type ShipmentStatus,
  type ShipmentSummary,
} from "@/types/order-flow";
import { PagedTable, usePagedList, type PageParams } from "./paged-table";
import { carrierLabel, formatVND, ShipmentStatusBadge } from "./shipment-ui";

/** Bộ lọc của tab (không gồm trang). */
interface ShipmentFilters {
  status?: ShipmentStatus;
  carrierType?: CarrierType;
  from?: string;
  to?: string;
  search?: string;
}

type ShipmentListQuery = PageParams & ShipmentFilters;

/** Khai báo ngoài component để `usePagedList` nhận một hàm ổn định. */
const loadShipments = (query: ShipmentListQuery) => shipmentApi.getList(query);

const ALL = "all";

// ─── Cột ────────────────────────────────────────────────────────────────────

const shipmentsColumns: ColumnDef<ShipmentSummary>[] = [
  {
    id: "order",
    header: "Mã đơn",
    cell: ({ row }) => <span className="font-medium">{row.original.order.code}</span>,
  },
  {
    id: "customer",
    header: "Khách hàng",
    cell: ({ row }) => row.original.order.customerName,
  },
  {
    id: "carrier",
    header: "Giao bởi",
    cell: ({ row }) => (
      <>
        {carrierLabel(row.original.carrierType, row.original.carrierName)}
        <span className="block text-xs text-muted-foreground">
          {row.original.carrierType === "INTERNAL" ? personName(row.original.driver) : row.original.trackingCode}
        </span>
      </>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
  },
  {
    id: "amountDue",
    header: () => <div className="text-right">Còn phải thu</div>,
    cell: ({ row }) => <div className="text-right">{formatVND(row.original.order.amountDue)}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
  },
];

// ─── Thanh lọc ──────────────────────────────────────────────────────────────

/** Ô tìm kiếm chỉ áp khi bấm Enter / nút Tìm, để không gọi BE theo từng phím. Đổi bộ lọc thì nơi gọi đưa trang về 1. */
function ShipmentsToolbar({
  filters,
  onChange,
}: {
  filters: ShipmentFilters;
  onChange: (filters: ShipmentFilters) => void;
}) {
  const [search, setSearch] = useState(filters.search ?? "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ ...filters, search: search.trim() || undefined });
        }}
        className="flex flex-1 min-w-56 max-w-sm items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã đơn, mã vận đơn, người nhận..."
            className="pl-9 h-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Tìm
        </Button>
      </form>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, status: value === ALL ? undefined : (value as ShipmentStatus) })
        }
      >
        <SelectTrigger className="h-9 w-44 cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Mọi trạng thái</SelectItem>
          {(Object.keys(SHIPMENT_STATUS_LABELS) as ShipmentStatus[])
            .filter((status) => status !== "CREATED")
            .map((status) => (
              <SelectItem key={status} value={status}>
                {SHIPMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.carrierType ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, carrierType: value === ALL ? undefined : (value as CarrierType) })
        }
      >
        <SelectTrigger className="h-9 w-44 cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Mọi hình thức</SelectItem>
          <SelectItem value="INTERNAL">Shipper của shop</SelectItem>
          <SelectItem value="EXTERNAL">Đơn vị vận chuyển</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        aria-label="Từ ngày"
        value={filters.from ?? ""}
        onChange={(event) => onChange({ ...filters, from: event.target.value || undefined })}
        className="h-9 w-40"
      />
      <span className="text-sm text-muted-foreground">–</span>
      <Input
        type="date"
        aria-label="Đến ngày"
        value={filters.to ?? ""}
        onChange={(event) => onChange({ ...filters, to: event.target.value || undefined })}
        className="h-9 w-40"
      />
    </div>
  );
}

// ─── Tab ────────────────────────────────────────────────────────────────────

interface ShipmentsTabProps {
  reloadKey: number;
  onOpen: (shipment: ShipmentSummary) => void;
}

/** Bảng lần giao kèm thanh lọc, phân trang ở server. */
export function ShipmentsTab({ reloadKey, onOpen }: ShipmentsTabProps) {
  const [query, setQuery] = useState<ShipmentListQuery>({ page: 1, limit: SHIPMENT_PAGE_SIZE });
  const state = usePagedList(loadShipments, query, setQuery, reloadKey);

  return (
    <div className="space-y-4">
      <ShipmentsToolbar
        filters={query}
        // Đổi bộ lọc → về trang 1, đặt cùng một lần để không gọi BE cho trang cũ với bộ lọc mới.
        onChange={(filters) => setQuery({ ...filters, page: 1, limit: query.limit })}
      />
      <PagedTable
        state={state}
        query={query}
        onQueryChange={setQuery}
        columns={shipmentsColumns}
        unit="lần giao"
        emptyText="Không có lần giao nào"
        errorText="Không tải được danh sách lần giao - bấm Tải lại để thử lại"
        onRowClick={onOpen}
      />
    </div>
  );
}
