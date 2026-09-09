import { type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatStaffDate,
  getStaffInitials,
} from "@/app/(protected)/staffs/shared/staff-format";
import {
  STAFF_ROLE_BADGE_VARIANT,
  getStaffStatusDisplay,
} from "@/app/(protected)/staffs/shared/staff-status";
import type { Staff } from "@/types/staff";

export const staffsColumns: ColumnDef<Staff>[] = [
  {
    id: "avatar",
    header: "Ảnh",
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <Avatar className="size-9">
          {staff.profile?.avatarUrl ? (
            <AvatarImage src={staff.profile.avatarUrl} alt={staff.fullName} />
          ) : null}
          <AvatarFallback className="text-xs">
            {getStaffInitials(staff.fullName)}
          </AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    size: 56,
  },
  {
    accessorKey: "fullName",
    header: "Nhân viên",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.fullName}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.email || "Chưa có email"}
        </span>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.phoneNumber}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "roleName",
    header: "Vai trò",
    // Roles are rows the shop owner defines, so there is no fixed set to colour-code -
    // one neutral badge showing whatever they named it.
    cell: ({ row }) => (
      <Badge variant={STAFF_ROLE_BADGE_VARIANT}>{row.original.roleName}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "branchName",
    header: "Chi nhánh",
    cell: ({ row }) => <span>{row.original.branchName}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "joinedAt",
    header: "Ngày vào làm",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatStaffDate(row.original.joinedAt)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const config = getStaffStatusDisplay(row.original.status);
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    enableSorting: false,
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

export { STAFF_ROLE_BADGE_VARIANT as ROLE_LABELS };
