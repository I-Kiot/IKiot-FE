import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { ScheduleStatus } from "@/types/working-schedule";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const SCHEDULE_STATUS_MAP: Record<
  ScheduleStatus,
  { label: string; variant: BadgeVariant }
> = {
  SCHEDULED: { label: "Đã phân ca", variant: "info" },
  COMPLETED: { label: "Hoàn thành", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "secondary" },
};
