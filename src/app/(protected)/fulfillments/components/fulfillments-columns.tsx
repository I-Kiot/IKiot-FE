// [Table – Columns Fulfillment]
"use client";

// Định nghĩa cột bảng Đóng hàng (TanStack Table).

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { PackableOrder } from "@/types/order-flow";

/**
 * Số loại sản phẩm trong đơn = số SKU khác nhau, KHÔNG phải số dòng (`items.length`):
 * cùng một SKU có thể nằm ở hai dòng (vd. một dòng có thông số đặt riêng), đếm dòng sẽ ra dư.
 * Dòng chưa có SKU thì tính riêng theo id dòng.
 */
function productKindCount(order: PackableOrder): number {
  return new Set(order.items.map((item) => item.sku ?? item.id)).size;
}

interface FulfillmentsColumnsOptions {
  /** Người dùng có quyền `orders:pack` - không có thì ẩn nút. */
  canPack: boolean;
  /** Mở dialog đóng gói cho đơn. */
  onPack: (order: PackableOrder) => void;
}

/** Định nghĩa cột bảng đơn chờ đóng gói; nút "Đóng hàng" cần quyền và handler từ trang nên nhận qua tham số. */
export function fulfillmentsColumns({ canPack, onPack }: FulfillmentsColumnsOptions): ColumnDef<PackableOrder>[] {
  return [
    {
      accessorKey: "code",
      header: "Mã đơn",
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: ({ row }) => (
        <>
          {row.original.customer.name}
          {row.original.customer.phone && (
            <span className="block text-xs text-muted-foreground">{row.original.customer.phone}</span>
          )}
        </>
      ),
    },
    {
      id: "branch",
      header: "Chi nhánh",
      cell: ({ row }) => row.original.branch.name,
    },
    {
      // Trước là "Số dòng" - khó hiểu với cả dev lẫn người dùng.
      id: "productKinds",
      header: () => <div className="text-right">Số loại sản phẩm</div>,
      cell: ({ row }) => <div className="text-right">{productKindCount(row.original)}</div>,
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
        canPack && (
          <Button size="sm" onClick={() => onPack(row.original)}>
            Đóng hàng
          </Button>
        ),
    },
  ];
}
