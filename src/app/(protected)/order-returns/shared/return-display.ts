// [Display – Order returns] Badges shared by the return list and its dialogs (D-6).
// Labels come from `@/types/order-flow`; this file only decides how they look.
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import {
  ORDER_RETURN_REASON_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  RETURN_CONDITION_LABELS,
  type OrderReturnReason,
  type OrderReturnStatus,
  type ReturnCondition,
} from "@/types/order-flow";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeDisplay {
  label: string;
  variant: BadgeVariant;
}

/** Waiting on staff = info, being checked = warning, done = success, ended = error. */
const STATUS_VARIANT: Record<OrderReturnStatus, BadgeVariant> = {
  REQUESTED: "info",
  INSPECTING: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

const CONDITION_VARIANT: Record<ReturnCondition, BadgeVariant> = {
  GOOD: "success",
  DAMAGED: "error",
};

export function returnStatusDisplay(status: OrderReturnStatus): BadgeDisplay {
  return {
    label: ORDER_RETURN_STATUS_LABELS[status] ?? status,
    variant: STATUS_VARIANT[status] ?? "outline",
  };
}

export function returnReasonLabel(reason: OrderReturnReason): string {
  return ORDER_RETURN_REASON_LABELS[reason] ?? reason;
}

export function returnConditionDisplay(condition: ReturnCondition): BadgeDisplay {
  return {
    label: RETURN_CONDITION_LABELS[condition] ?? condition,
    variant: CONDITION_VARIANT[condition] ?? "outline",
  };
}

/** A return still open: it can be received, inspected or cancelled. */
export function isOpenReturn(status: OrderReturnStatus): boolean {
  return status === "REQUESTED" || status === "INSPECTING";
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
