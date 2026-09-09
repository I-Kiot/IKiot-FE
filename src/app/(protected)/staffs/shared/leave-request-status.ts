import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type {
  LeaveRequestKind,
  LeaveRequestStatus,
} from "@/types/leave-request";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const LEAVE_STATUS_MAP: Record<
  LeaveRequestStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt", variant: "success" },
  REJECTED: { label: "Từ chối", variant: "error" },
  CANCELLED: { label: "Đã hủy", variant: "secondary" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
  DELETED: { label: "Đã xóa", variant: "secondary" },
};

/** Derived from paidLeaveDays / unpaidLeaveDays (BE has no leaveType). */
export const LEAVE_KIND_MAP: Record<
  LeaveRequestKind,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "Chưa phân loại", variant: "secondary" },
  PAID: { label: "Có lương", variant: "success" },
  UNPAID: { label: "Không lương", variant: "info" },
  MIXED: { label: "Hỗn hợp", variant: "warning" },
};
