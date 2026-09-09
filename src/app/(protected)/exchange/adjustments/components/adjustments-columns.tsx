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
import { sumAdjustQtyChange, formatQtyChange } from "@/app/(protected)/exchange/shared/qty";
import { getMovementStatusConfig } from "@/app/(protected)/exchange/shared/movement-labels";
import {
  getMovementNotePreview,
  hasAnyMovementNote,
} from "@/app/(protected)/exchange/shared/qty";
import type { StockMovement, MovementStatus } from "@/types/stock-movement";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
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

export const adjustmentsColumns: ColumnDef<StockMovement>[] = [
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
    accessorKey: "id",
    header: "Mã phiếu",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{String(row.getValue("id")).slice(-6).toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "fromLocationName",
    header: "Kho / Chi nhánh",
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{r.fromLocationName ?? "-"}</span>
          <span className="text-xs text-muted-foreground">
            {r.fromLocationType === "warehouse" ? "Kho" : "Chi nhánh"}
          </span>
        </div>
      );
    },
  },
  {
    id: "totalItems",
    header: "Số mặt hàng",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.details.length} mặt hàng</span>
    ),
  },
  {
    id: "totalQtyChange",
    header: ({ column }) => <SortableHeader label="Tổng thay đổi SL" column={column} />,
    accessorFn: (row) => sumAdjustQtyChange(row.details),
    cell: ({ getValue }) => {
      const v = getValue() as number;
      return (
        <span className={cn("tabular-nums font-medium", v > 0 ? "text-green-600 dark:text-green-400" : v < 0 ? "text-red-600 dark:text-red-400" : "")}>
          {formatQtyChange(v)}
        </span>
      );
    },
  },
  {
    accessorKey: "requestedByName",
    header: "Người tạo",
    cell: ({ row }) => <span className="text-sm">{row.getValue("requestedByName")}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader label="Ngày tạo" column={column} />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.getValue("createdAt")), "dd/MM/yyyy", { locale: vi })}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as MovementStatus;
      const config = getMovementStatusConfig(status, row.original.movementType);
      const hasNote = hasAnyMovementNote(row.original);
      const preview = getMovementNotePreview(row.original);
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={config.variant}>{config.label}</Badge>
          {hasNote && (
            <Badge variant="outline" className="gap-1 font-normal text-muted-foreground" title={preview}>
              <MessageSquareText className="size-3" />
              Ghi chú
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, columnId, value: string) => row.getValue(columnId) === value,
  },
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        {row.getIsExpanded() && (
          <span className="text-[11px] font-medium text-muted-foreground">Đang xem</span>
        )}
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
