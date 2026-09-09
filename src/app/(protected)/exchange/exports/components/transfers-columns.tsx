"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  MessageSquareText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MOVEMENT_STATUS_MAP } from "@/app/(protected)/exchange/shared/movement-labels";
import { MOVEMENT_TYPE_MAP } from "@/app/(protected)/exchange/shared/movement-labels";
import {
  getMovementNotePreview,
  hasAnyMovementNote,
} from "@/app/(protected)/exchange/shared/qty";
import type { TransferUiLabels } from "@/app/(protected)/exchange/shared/transfer-ui-labels";
import type { StockMovement, MovementStatus } from "@/types/stock-movement";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
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

export function createTransfersColumns(
  labels: Pick<TransferUiLabels, "fromColumnHeader" | "toColumnHeader">,
): ColumnDef<StockMovement>[] {
  return [
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
    id: "movementType",
    header: "Loại",
    cell: ({ row }) => {
      const cfg = MOVEMENT_TYPE_MAP[row.original.movementType];
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg?.className ?? ""}`}>
          {cfg?.label ?? row.original.movementType}
        </span>
      );
    },
    enableSorting: false,
    size: 90,
  },
  {
    accessorKey: "id",
    header: "Mã yêu cầu",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{String(row.getValue("id")).slice(-6).toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "fromLocationName",
    header: labels.fromColumnHeader,
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {record.fromLocationName ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {record.fromLocationType === "warehouse" ? "Kho" : "Chi nhánh"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "toLocationName",
    header: labels.toColumnHeader,
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{record.toLocationName}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {record.toLocationType === "warehouse" ? "Kho" : "Chi nhánh"}
          </span>
        </div>
      );
    },
  },
  {
    id: "totalItems",
    header: "Số mặt hàng",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.details.length} mặt hàng
      </span>
    ),
  },
  {
    id: "totalQty",
    header: ({ column }) => <SortableHeader label="Tổng SL" column={column} />,
    accessorFn: (row) => row.details.reduce((sum, item) => sum + item.quantity, 0),
    cell: ({ getValue }) => (
      <span className="tabular-nums">
        {(getValue() as number).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    accessorKey: "requestedByName",
    header: "Người yêu cầu",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("requestedByName")}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader label="Ngày tạo" column={column} />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.getValue("createdAt")), "dd/MM/yyyy", {
          locale: vi,
        })}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as MovementStatus;
      const config = MOVEMENT_STATUS_MAP[status];
      const hasNote = hasAnyMovementNote(row.original);
      const preview = getMovementNotePreview(row.original);
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={config.variant}>{config.label}</Badge>
          {hasNote && (
            <Badge
              variant="outline"
              className="gap-1 font-normal text-muted-foreground"
              title={preview}
            >
              <MessageSquareText className="size-3" />
              Ghi chú
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, columnId, value: string) =>
      row.getValue(columnId) === value,
  },
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        {row.getIsExpanded() ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            Đang xem
          </span>
        ) : null}
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            row.getIsExpanded() && "rotate-90",
          )}
        />
      </div>
    ),
    size: 88,
    enableSorting: false,
    enableHiding: false,
  },
];
}

export { MOVEMENT_STATUS_MAP as STATUS_MAP };
