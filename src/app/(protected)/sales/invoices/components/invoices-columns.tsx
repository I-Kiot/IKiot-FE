import { type ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface InvoiceItem {
  productItemId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  customer: {
    code: string;
    name: string;
    phone: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    address: string;
  };
  status: "COMPLETED" | "CANCELLED" | "RETURNED" | "PENDING";
  userId: string;
  seller: {
    name: string;
    email: string;
    role: string;
  };
  paymentMethod: "CASH" | "BANK_TRANSFER" | "MOMO" | "VNPAY" | "SEPAY";
  grandTotal: number;
  customerPay: number;
  change: number;
  note: string;
  items: InvoiceItem[];
  discountType?: "ORDER" | "PROMOTION" | null;
  discountValue?: number;
  appliedPromotions?: {
    promotionId: string;
    promoName: string;
    discountAmount: number;
    id?: string;
  }[] | null;
  createdAt: string;
  updatedAt: string;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export const STATUS_MAP: Record<
  Invoice["status"],
  {
    label: string;
    variant:
      | "success"
      | "warning"
      | "error"
      | "info"
      | "default"
      | "secondary"
      | "destructive"
      | "outline";
  }
> = {
  COMPLETED: {
    label: "Đã hoàn thành",
    variant: "success",
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "error",
  },
  RETURNED: {
    label: "Trả hàng",
    variant: "info",
  },
  PENDING: {
    label: "Đang chờ",
    variant: "warning",
  },
};

export const PAYMENT_METHOD_MAP: Record<Invoice["paymentMethod"], string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "Ví MoMo",
  VNPAY: "Ví VNPay",
  SEPAY: "Cổng SePay",
};

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 cursor-pointer hover:text-foreground font-semibold"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ChevronUp className="size-3" />
      ) : sorted === "desc" ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

export const invoicesColumns: ColumnDef<Invoice>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn dòng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "invoiceCode",
    header: ({ column }) => (
      <SortableHeader label="Mã hóa đơn" column={column} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold text-primary">
        {row.getValue("invoiceCode")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader label="Thời gian" column={column} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "customer.code",
    header: "Mã khách hàng",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium bg-muted py-0.5 px-1.5 rounded">
        {row.original.customer.code}
      </span>
    ),
  },
  {
    accessorKey: "customer.name",
    header: "Khách hàng",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm text-foreground">
          {row.original.customer.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer.phone}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "seller.name",
    header: "Người bán",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.seller.name}</span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: ({ column }) => (
      <SortableHeader label="Tổng tiền hàng" column={column} />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatVND(row.getValue("grandTotal"))}
      </span>
    ),
  },
  {
    accessorKey: "customerPay",
    header: "Khách đã trả",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatVND(row.getValue("customerPay"))}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Thanh toán",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as Invoice["paymentMethod"];
      return PAYMENT_METHOD_MAP[method] || "-";
    },
    filterFn: (row, columnId, value: string) => {
      if (!value || value === "all") return true;
      return row.getValue(columnId) === value;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      const { label, variant } = STATUS_MAP[status];
      return (
        <Badge variant={variant as "success" | "warning" | "error" | "info"}>
          {label}
        </Badge>
      );
    },
    filterFn: (row, columnId, value: string) => {
      if (!value || value === "all") return true;
      return row.getValue(columnId) === value;
    },
  },
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <ChevronRight
        className={cn(
          "size-5 text-muted-foreground transition-transform duration-200 cursor-pointer p-0.5 rounded-full hover:bg-muted",
          row.getIsExpanded() && "rotate-90 text-primary bg-primary/10",
        )}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
];
