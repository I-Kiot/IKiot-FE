// Badge và định dạng dùng chung cho danh sách đơn (D-1) và chi tiết đơn (D-3). Nhãn lấy từ `@/types/order-flow`; file này chỉ quyết định cách hiển thị.
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_PRIORITY_LABELS,
  SHIPMENT_STATUS_LABELS,
  isDeliveryFailed,
  type ShipmentStatus,
  ORDER_STATUS_LABELS,
  STOCK_CHECK_STATUS_LABELS,
  type FulfillmentType,
  type OrderPaymentStatus,
  type OrderPriority,
  type OrderStatus,
  type StockCheckStatus,
} from "@/types/order-flow";
import { PICKUP_WAITING_LABEL } from "@/lib/order-pickup";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeDisplay {
  label: string;
  variant: BadgeVariant;
}

/** Chờ nhân viên = info, chờ bên khác = warning, xong = success, kết thúc lỗi = error. */
const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING_CONFIRMATION: "outline",
  CONFIRMED: "info",
  PACKED: "info",
  PICKED_UP: "warning",
  SHIPPING: "warning",
  // Đã giao nhưng shipper còn giữ tiền.
  RECEIVED: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  RETURNED: "muted",
  PENDING: "outline",
};

/** Còn nợ = warning, đủ = success, đã trả lại tiền = secondary. */
const PAYMENT_STATUS_VARIANT: Record<OrderPaymentStatus, BadgeVariant> = {
  UNPAID: "outline",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  PARTIALLY_REFUNDED: "secondary",
  REFUNDED: "secondary",
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

export function orderStatusDisplay(
  status: OrderStatus,
  latestShipmentStatus?: ShipmentStatus | null,
  fulfillmentType?: FulfillmentType,
): BadgeDisplay {
  // Giao thất bại thì đơn vẫn SHIPPING (hàng còn ngoài); hiện lý do shipper báo.
  if (isDeliveryFailed({ status, latestShipmentStatus: latestShipmentStatus ?? null })) {
    return { label: SHIPMENT_STATUS_LABELS.FAILED, variant: "error" };
  }
  // Đơn khách tới lấy đã đóng gói thì đang chờ khách ở cửa hàng, không chờ bên vận chuyển.
  if (status === "PACKED" && fulfillmentType === "STORE_PICKUP") {
    return { label: PICKUP_WAITING_LABEL, variant: "info" };
  }
  return {
    label: ORDER_STATUS_LABELS[status] ?? status,
    variant: ORDER_STATUS_VARIANT[status] ?? "outline",
  };
}

export function paymentStatusDisplay(status: OrderPaymentStatus): BadgeDisplay {
  return {
    label: ORDER_PAYMENT_STATUS_LABELS[status] ?? status,
    variant: PAYMENT_STATUS_VARIANT[status] ?? "outline",
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

/** Dòng tồn xấu nhất của đơn (danh sách gọi là stockSummary); null khi không dòng nào có stockCheck. */
export function worstStock(
  lines: { stockCheck: { status: StockCheckStatus } | null }[],
): StockCheckStatus | null {
  const present = new Set(lines.map((line) => line.stockCheck?.status).filter(Boolean));
  return (["OUT", "PARTIAL", "ENOUGH"] as const).find((status) => present.has(status)) ?? null;
}

/** Dòng combo, rồi các thành phần (`depth: 1`) bên dưới; dòng thường giữ nguyên thứ tự. */
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

/** Chuỗi thời gian ISO hiển thị dạng `dd/MM/yyyy HH:mm`, theo múi giờ người xem. */
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
 * `YYYY-MM-DD` (requestedDeliveryDate) thành `dd/MM/yyyy`. Tách chuỗi thay vì parse: `new Date("2026-10-10")` là nửa đêm UTC,
 * nên hiện thành ngày 9 ở các múi giờ phía tây Greenwich.
 */
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

/** Số ngày lịch từ hôm nay (theo ngày địa phương của người xem) tới ngày `YYYY-MM-DD`; âm khi đã qua. */
export function daysUntilPlainDate(value: string): number | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - today) / 86_400_000);
}
