// [Display – Order journey] Badges and formatting shared by the order list (D-1) and the
// order detail (D-3). Labels come from `@/types/order-flow`; this file only decides how they look.
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  STOCK_CHECK_STATUS_LABELS,
  type OrderPriority,
  type OrderStatus,
  type StockCheckStatus,
} from "@/types/order-flow";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeDisplay {
  label: string;
  variant: BadgeVariant;
}

/** Waiting on staff = info, waiting on someone else = warning, done = success, ended badly = error. */
const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING_CONFIRMATION: "outline",
  CONFIRMED: "info",
  PACKED: "info",
  PICKED_UP: "warning",
  SHIPPING: "warning",
  // Delivered, but the shipper still holds the cash.
  RECEIVED: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  RETURNED: "secondary",
  PENDING: "outline",
};

const PRIORITY_VARIANT: Record<OrderPriority, BadgeVariant> = {
  NORMAL: "outline",
  HIGH: "warning",
  URGENT: "error",
};

const STOCK_VARIANT: Record<StockCheckStatus, BadgeVariant> = {
  ENOUGH: "success",
  PARTIAL: "warning",
  OUT: "error",
};

export function orderStatusDisplay(status: OrderStatus): BadgeDisplay {
  return {
    label: ORDER_STATUS_LABELS[status] ?? status,
    variant: ORDER_STATUS_VARIANT[status] ?? "outline",
  };
}

export function priorityDisplay(priority: OrderPriority): BadgeDisplay {
  return {
    label: ORDER_PRIORITY_LABELS[priority] ?? priority,
    variant: PRIORITY_VARIANT[priority] ?? "outline",
  };
}

export function stockDisplay(status: StockCheckStatus): BadgeDisplay {
  return {
    label: STOCK_CHECK_STATUS_LABELS[status] ?? status,
    variant: STOCK_VARIANT[status] ?? "outline",
  };
}

/** The order's worst line (what the list calls stockSummary); null when no line has a stockCheck. */
export function worstStock(
  lines: { stockCheck: { status: StockCheckStatus } | null }[],
): StockCheckStatus | null {
  const present = new Set(lines.map((line) => line.stockCheck?.status).filter(Boolean));
  return (["OUT", "PARTIAL", "ENOUGH"] as const).find((status) => present.has(status)) ?? null;
}

/** A combo line, then its components (`depth: 1`) under it; plain lines as they come. */
export function orderedLines<T extends { id: string; parentItemId: string | null }>(
  items: T[],
): { line: T; depth: number }[] {
  const children = new Map<string, T[]>();
  for (const line of items) {
    if (line.parentItemId) {
      children.set(line.parentItemId, [...(children.get(line.parentItemId) ?? []), line]);
    }
  }
  return items
    .filter((line) => !line.parentItemId)
    .flatMap((line) => [
      { line, depth: 0 },
      ...(children.get(line.id) ?? []).map((child) => ({ line: child, depth: 1 })),
    ]);
}

export const formatVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

/** An ISO timestamp as `dd/MM/yyyy HH:mm`, in the viewer's time zone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A plain `YYYY-MM-DD` (requestedDeliveryDate) as `dd/MM/yyyy`. Split rather than parsed:
 * `new Date("2026-10-10")` is UTC midnight, which shows as the 9th west of Greenwich.
 */
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
