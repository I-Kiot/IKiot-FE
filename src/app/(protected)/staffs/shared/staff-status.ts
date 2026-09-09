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

/**
 * Roles are tenant-defined rows now, so there is no fixed set to give a colour to. Every
 * role badge uses the same neutral variant and shows the role's own name.
 */
export const STAFF_ROLE_BADGE_VARIANT: BadgeVariant = "outline";

export function getStaffStatusDisplay(status: StaffStatus) {
  return (
    STAFF_STATUS_MAP[status] ?? {
      label: status,
      variant: "outline" as BadgeVariant,
    }
  );
}
