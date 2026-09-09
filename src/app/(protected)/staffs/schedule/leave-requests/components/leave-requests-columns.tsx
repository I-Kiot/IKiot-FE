import { type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  LEAVE_KIND_MAP,
  LEAVE_STATUS_MAP,
} from "@/app/(protected)/staffs/shared/leave-request-status";
import { formatLeaveDate } from "@/lib/api/leave-request-mapper";
import type { LeaveRequest } from "@/types/leave-request";

export const leaveRequestsColumns: ColumnDef<LeaveRequest>[] = [
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
    accessorKey: "staffName",
    header: "Nhân viên",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.staffName}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.branchName}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "kind",
    header: "Phân loại",
    cell: ({ row }) => {
      const config = LEAVE_KIND_MAP[row.original.kind] ?? {
        label: row.original.kind,
        variant: "secondary" as const,
      };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    id: "duration",
    header: "Khoảng thời gian",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span>
          {formatLeaveDate(row.original.fromDate, true)} -{" "}
          {formatLeaveDate(row.original.toDate, true)}
        </span>
        <span className="text-muted-foreground">
          {row.original.totalDays} ngày
        </span>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatLeaveDate(row.original.createdAt, true)}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Lý do",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1">
        {row.original.reason}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const config = LEAVE_STATUS_MAP[row.original.status] ?? {
        label: row.original.status,
        variant: "secondary" as const,
      };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
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
    enableSorting: false,
    enableHiding: false,
  },
];
