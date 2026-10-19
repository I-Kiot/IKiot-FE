import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FULFILLMENT_TYPE_LABELS, type OrderListItem } from "@/types/order-flow";
import {
  daysUntilPlainDate,
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
  fulfillmentType: "Hình thức giao",
  priority: "Ưu tiên",
  stockSummary: "Tồn kho",
  assignee: "Phụ trách",
  driver: "Người giao hàng",
  requestedDeliveryDate: "Hẹn giao",
  products: "Sản phẩm",
  deliveryAddress: "Địa chỉ nhận hàng",
  grandTotal: "Tổng tiền",
  deposit: "Tiền cọc",
  amountDue: "Còn thu",
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
      const display = orderStatusDisplay(row.original.status, row.original.latestShipmentStatus);
      return <Badge variant={display.variant}>{display.label}</Badge>;
    },
  },
  {
    accessorKey: "fulfillmentType",
    header: ORDERS_COLUMN_LABELS.fulfillmentType,
    cell: ({ row }) => (
      <span className="text-sm">
        {FULFILLMENT_TYPE_LABELS[row.original.fulfillmentType] ?? row.original.fulfillmentType}
      </span>
    ),
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
    id: "driver",
    header: ORDERS_COLUMN_LABELS.driver,
    // Only meaningful while the goods are on the road.
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.status === "SHIPPING" ? (row.original.driver?.name ?? "-") : "-"}
      </span>
    ),
  },
  {
    accessorKey: "requestedDeliveryDate",
    header: ORDERS_COLUMN_LABELS.requestedDeliveryDate,
    // Within 10 days the date is replaced by a countdown; further out it stays a date.
    cell: ({ row }) => {
      const value = row.original.requestedDeliveryDate;
      const days = value ? daysUntilPlainDate(value) : null;
      if (value && days !== null && days <= 10) {
        const overdue = days < 0;
        return (
          <span
            className={cn("text-sm", overdue && "text-destructive")}
            title={formatPlainDate(value)}
          >
            {days === 0
              ? "Hôm nay"
              : overdue
                ? `Quá hạn ${-days} ngày`
                : `Còn ${days} ngày`}
          </span>
        );
      }
      return <span className="text-sm">{formatPlainDate(value)}</span>;
    },
  },
  {
    id: "products",
    header: ORDERS_COLUMN_LABELS.products,
    cell: ({ row }) => {
      const items = row.original.items;
      const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (items.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="cursor-default">
              {quantity} sản phẩm
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  {item.productName ?? item.sku ?? "-"}
                  {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "deliveryAddress",
    header: ORDERS_COLUMN_LABELS.deliveryAddress,
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-64 text-sm" title={row.original.deliveryAddress ?? undefined}>
        {row.original.deliveryAddress ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: ORDERS_COLUMN_LABELS.grandTotal,
    cell: ({ row }) => (
      <span className="font-medium">{formatVND(row.original.grandTotal)}</span>
    ),
  },
  {
    id: "deposit",
    header: ORDERS_COLUMN_LABELS.deposit,
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.deposit ? formatVND(row.original.deposit.amount) : "-"}
      </span>
    ),
  },
  {
    id: "amountDue",
    header: ORDERS_COLUMN_LABELS.amountDue,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{formatVND(row.original.amountDue)}</span>
    ),
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
