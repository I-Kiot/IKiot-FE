import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { MovementStatus, MovementType } from "@/types/stock-movement";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type MovementStatusConfig = {
  label: string;
  variant: BadgeVariant;
};

export const MOVEMENT_STATUS_MAP: Record<MovementStatus, MovementStatusConfig> =
  {
    DRAFT: { label: "Nháp", variant: "secondary" },
    OPENING: { label: "Đang soạn", variant: "warning" },
    CLOSED: { label: "Đã chốt", variant: "info" },
    PENDING: { label: "Chờ giao hàng", variant: "warning" },
    IN_TRANSIT: { label: "Đang vận chuyển", variant: "info" },
    RECEIVED: { label: "Đã nhận hàng", variant: "success" },
    CANCELLED: { label: "Đã huỷ", variant: "secondary" },
    COMPLETED: { label: "Hoàn tất", variant: "success" },
  };

/** Label trạng thái theo loại phiếu (PENDING dùng chung IMPORT + ADJUST). */
export function getMovementStatusConfig(
  status: MovementStatus,
  movementType?: MovementType | string,
): MovementStatusConfig {
  const base = MOVEMENT_STATUS_MAP[status] ?? {
    label: status,
    variant: "secondary" as BadgeVariant,
  };
  if (status === "PENDING" && movementType === "ADJUST") {
    return { label: "Chờ duyệt", variant: "warning" };
  }
  if (status === "COMPLETED" && movementType === "ADJUST") {
    return { label: "Đã điều chỉnh", variant: "success" };
  }
  return base;
}

export const MOVEMENT_TYPE_MAP: Record<
  MovementType,
  { label: string; className: string }
> = {
  IMPORT: {
    label: "Nhập hàng",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  EXPORT: {
    label: "Xuất kho",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  ADJUST: {
    label: "Điều chỉnh",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  RETURN: {
    label: "Trả kho",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

/** Trạng thái cần xử lý theo loại phiếu */
export function isActionableStatus(
  movementType: string,
  status: MovementStatus,
): boolean {
  if (status === "CANCELLED" || status === "RECEIVED" || status === "COMPLETED") {
    return false;
  }
  if (movementType === "IMPORT") {
    return status === "PENDING" || status === "IN_TRANSIT";
  }
  if (movementType === "EXPORT" || movementType === "RETURN") {
    return ["DRAFT", "OPENING", "CLOSED", "IN_TRANSIT"].includes(status);
  }
  return status === "PENDING";
}
