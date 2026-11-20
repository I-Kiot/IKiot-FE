// Badge và định dạng dùng chung cho danh sách cần sản xuất (B-4, B-6) và màn yêu cầu sản xuất (B-6, B-7).
// Nhãn lấy từ `@/types/order-flow`.
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import {
  PRODUCTION_DELIVERY_STATUS_LABELS,
  type LineProductionProgress,
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionDeliveryStatus,
  type ProductionRequest,
  type ProductionRequestStatus,
} from "@/types/order-flow";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Đang soạn = outline, ở xưởng = info, đã vào một phần = warning, xong = success, huỷ = error. */
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

/**
 * Xưởng đang ở bước nào (2026-11-16), chỉ có ý nghĩa khi YCSX đã gửi mà chưa về đủ.
 * Có phiếu giao chờ nhận thì là "đã giao hàng" (kho cần kiểm và nhận); nhận / từ chối / rút phiếu xong mà còn phần chưa giao thì về lại "đang làm".
 * null = không hiện gì (nháp, đã xong, đã huỷ). Màn xưởng và màn shop dùng chung để hai bên đọc cùng một chữ.
 */
export function workshopAcceptanceDisplay(
  request: Pick<ProductionRequest, "status" | "acceptedAt" | "deliveries">,
): { label: string; variant: BadgeVariant } | null {
  const hasPendingDelivery = (request.deliveries ?? []).some((delivery) => delivery.status === "PENDING");
  return workshopStageDisplay(request.status, request.acceptedAt, hasPendingDelivery);
}

/** Cùng luật với `workshopAcceptanceDisplay` nhưng nhận dữ liệu rời, cho nơi chỉ có tóm tắt (tiến độ trên dòng đơn). */
export function workshopStageDisplay(
  status: ProductionRequestStatus,
  acceptedAt: string | null | undefined,
  hasPendingDelivery: boolean,
): { label: string; variant: BadgeVariant } | null {
  const inProgress = status === "SENT" || status === "PARTIALLY_RECEIVED";
  if (!inProgress) return null;
  if (hasPendingDelivery) return { label: "Xưởng đã giao hàng", variant: "warning" };
  if (acceptedAt) return { label: "Xưởng đang làm", variant: "success" };
  if (status === "SENT") return { label: "Chờ xưởng xác nhận", variant: "warning" };
  return null;
}

/** Nhãn tiến độ của một YCSX trên dòng đơn: bước của xưởng khi đang làm, còn lại là trạng thái YCSX ("Nháp", "Nhận một phần", "Hoàn tất", "Đóng (nhận thiếu)"). */
export function lineProgressDisplay(
  progress: Pick<LineProductionProgress, "status" | "acceptedAt" | "deliveringQuantity" | "closedShort">,
): { label: string; variant: BadgeVariant } {
  return (
    workshopStageDisplay(progress.status, progress.acceptedAt, progress.deliveringQuantity > 0) ??
    requestStatusDisplay(progress.status, progress.closedShort)
  );
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

/** Số lượng đặt và đã nhận trên các dòng của yêu cầu. */
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
  // Ngày thuần (`YYYY-MM-DD`) là ngày lịch, không phải thời điểm: không được lệch theo múi giờ.
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

export { todayIso } from "@/lib/date-input";
