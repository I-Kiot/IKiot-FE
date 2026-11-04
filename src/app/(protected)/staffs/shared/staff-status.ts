import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { StaffStatus } from "@/types/staff";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const STAFF_STATUS_MAP: Record<
  StaffStatus,
  { label: string; variant: BadgeVariant }
> = {
  ACTIVE: { label: "Đang làm việc", variant: "success" },
  INACTIVE: { label: "Ngừng làm việc", variant: "warning" },
  SUSPENDED: { label: "Tạm khóa", variant: "destructive" },
};

/** Role do shop tự định nghĩa nên không có bảng màu cố định; mọi badge role dùng cùng một variant trung tính. */
export const STAFF_ROLE_BADGE_VARIANT: BadgeVariant = "outline";

export function getStaffStatusDisplay(status: StaffStatus) {
  return (
    STAFF_STATUS_MAP[status] ?? {
      label: status,
      variant: "outline" as BadgeVariant,
    }
  );
}
