import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderListItem } from "@/types/order-flow";
import {
  formatDateTime,
  formatPlainDate,
  formatVND,
  orderStatusDisplay,
  priorityDisplay,
  stockDisplay,
} from "../shared/order-display";

export const ORDERS_COLUMN_LABELS: Record<string, string> = {
  code: "Mã đơn",
  customer: "Khách hàng",
  status: "Trạng thái",
  priority: "Ưu tiên",
  stockSummary: "Tồn kho",
  assignee: "Phụ trách",
  requestedDeliveryDate: "Hẹn giao",
  grandTotal: "Tổng tiền",
  createdAt: "Ngày tạo",
};

export const ordersColumns: ColumnDef<OrderListItem>[] = [
  {
    accessorKey: "code",
    header: ORDERS_COLUMN_LABELS.code,
    cell: ({ row }) => (
      <div className="flex flex-col">
        {/* Opens the detail (D-3); stopPropagation so the click does not also toggle the row. */}
        <Link
          href={`/sales/orders/${row.original.id}`}
          onClick={(event) => event.stopPropagation()}
          className="font-mono text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {row.original.code}
        </Link>
        <span className="text-xs text-muted-foreground">
          {row.original.branch?.name ?? "-"}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "customer",
    header: ORDERS_COLUMN_LABELS.customer,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer?.name ?? "-"}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer?.phone ?? ""}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ORDERS_COLUMN_LABELS.status,
    cell: ({ row }) => {
      const display = orderStatusDisplay(row.original.status);
      return <Badge variant={display.variant}>{display.label}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: ORDERS_COLUMN_LABELS.priority,
    cell: ({ row }) => {
      const display = priorityDisplay(row.original.priority);
      return <Badge variant={display.variant}>{display.label}</Badge>;
    },
  },
  {
    accessorKey: "stockSummary",
    header: ORDERS_COLUMN_LABELS.stockSummary,
    // Null once the order has shipped: there is nothing left to have in stock.
    cell: ({ row }) => {
      const summary = row.original.stockSummary;
      if (!summary) return <span className="text-muted-foreground">-</span>;
      const display = stockDisplay(summary);
      return <Badge variant={display.variant}>{display.label}</Badge>;
    },
  },
  {
    id: "assignee",
    header: ORDERS_COLUMN_LABELS.assignee,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.assignee?.name ?? "-"}</span>
    ),
  },
  {
    accessorKey: "requestedDeliveryDate",
    header: ORDERS_COLUMN_LABELS.requestedDeliveryDate,
    cell: ({ row }) => (
      <span className="text-sm">
        {formatPlainDate(row.original.requestedDeliveryDate)}
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: ORDERS_COLUMN_LABELS.grandTotal,
    // The total, and under it what is still to collect when a deposit was taken.
    cell: ({ row }) => {
      const { grandTotal, amountDue, deposit } = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{formatVND(grandTotal)}</span>
          {deposit && (
            <span className="text-xs text-muted-foreground">
              {amountDue > 0 ? `Còn thu ${formatVND(amountDue)}` : "Đã cọc đủ"}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ORDERS_COLUMN_LABELS.createdAt,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <ChevronRight
        className={cn(
          "size-4 text-muted-foreground transition-transform duration-200",
          row.getIsExpanded() && "rotate-90",
        )}
      />
    ),
    size: 40,
    enableHiding: false,
  },
];
