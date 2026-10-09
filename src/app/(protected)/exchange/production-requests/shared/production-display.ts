// [Display – Production] Badges and formatting shared by the production list (B-4 · B-6) and the
// production-request screens (B-6, B-7). Labels come from `@/types/order-flow`.
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import {
  PRODUCTION_DELIVERY_STATUS_LABELS,
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionDeliveryStatus,
  type ProductionRequest,
  type ProductionRequestStatus,
} from "@/types/order-flow";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Being drafted = outline, at the workshop = info, partly in = warning, done = success, dropped = error. */
const STATUS_VARIANT: Record<ProductionRequestStatus, BadgeVariant> = {
  DRAFT: "outline",
  SENT: "info",
  PARTIALLY_RECEIVED: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

export function requestStatusDisplay(
  status: ProductionRequestStatus,
  closedShort = false,
): { label: string; variant: BadgeVariant } {
  if (status === "COMPLETED" && closedShort) {
    return { label: "Đóng (nhận thiếu)", variant: "warning" };
  }
  return {
    label: PRODUCTION_REQUEST_STATUS_LABELS[status] ?? status,
    variant: STATUS_VARIANT[status] ?? "outline",
  };
}

/** Phiếu giao xưởng: chờ nhận = warning, đã nhận = success, đã huỷ = error. */
const DELIVERY_VARIANT: Record<ProductionDeliveryStatus, BadgeVariant> = {
  PENDING: "warning",
  RECEIVED: "success",
  CANCELLED: "error",
};

export function deliveryStatusDisplay(status: ProductionDeliveryStatus): {
  label: string;
  variant: BadgeVariant;
} {
  return {
    label: PRODUCTION_DELIVERY_STATUS_LABELS[status] ?? status,
    variant: DELIVERY_VARIANT[status] ?? "outline",
  };
}

/** Số còn giao được của một dòng: đặt − đã nhận − đang chờ nhận. */
export function deliverableQuantity(line: {
  quantity: number;
  receivedQuantity: number;
  pendingDeliveryQuantity: number;
}): number {
  return Math.max(0, line.quantity - line.receivedQuantity - line.pendingDeliveryQuantity);
}

/** Units ordered and received across the request's lines. */
export function requestProgress(request: Pick<ProductionRequest, "items">) {
  return request.items.reduce(
    (sum, line) => ({
      ordered: sum.ordered + line.quantity,
      received: sum.received + line.receivedQuantity,
    }),
    { ordered: 0, received: 0 },
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  // A plain date (`YYYY-MM-DD`) is a calendar day, not an instant: never shift it by the time zone.
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) return `${plain[3]}/${plain[2]}/${plain[1]}`;
  return new Date(value).toLocaleDateString("vi-VN");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

/** Today as `YYYY-MM-DD` in the browser's calendar - the minimum for a promised ready date. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
