"use client";

// Phần dùng chung của màn Giao hàng: báo lỗi theo mã, nhãn trạng thái, định dạng tiền, quyền hiện nút.

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser } from "@/lib/auth";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import {
  SHIPMENT_STATUS_LABELS,
  type CarrierType,
  type ShipmentStatus,
  type ShipmentSummary,
} from "@/types/order-flow";

/** Mã lỗi nghĩa là "đơn / lần giao vừa đổi ở nơi khác" – dữ liệu trên màn đã cũ, phải tải lại. */
const STALE_CODES = new Set([
  "ORDER_STATUS_CONFLICT",
  "ORDER_STATUS_TRANSITION_INVALID",
  "SHIPMENT_STATUS_INVALID",
  "SHIPMENT_ORDER_NOT_PACKED",
  "SHIPMENT_FULFILLMENT_NOT_HANDED_OVER",
]);

/** Hiện lỗi của một thao tác giao hàng; trả về `true` nếu màn hình cần tải lại vì dữ liệu đã cũ. */
export function reportShipmentError(error: unknown, fallback: string): boolean {
  const code = getApiErrorBody(error)?.code;
  toast.error(messageForCode(code) ?? fallback);
  return code !== undefined && STALE_CODES.has(code);
}

/** Đơn vị vận chuyển: "Shipper của shop" hoặc tên ĐVVC. */
export function carrierLabel(carrierType: CarrierType, carrierName: string | null): string {
  return carrierType === "INTERNAL" ? "Shipper của shop" : carrierName || "Đơn vị vận chuyển";
}

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function formatVND(value: number): string {
  return VND.format(value);
}

const STATUS_VARIANT: Record<ShipmentStatus, "info" | "warning" | "success" | "error" | "secondary"> = {
  CREATED: "secondary",
  PICKED_UP: "info",
  IN_TRANSIT: "warning",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
  FAILED: "error",
  RETURNED: "secondary",
  CANCELLED: "secondary",
};

/** Badge trạng thái lần giao. */
export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{SHIPMENT_STATUS_LABELS[status]}</Badge>;
}

/** Lần giao đang trên đường (đơn đã Đang vận chuyển): chỉ lúc này mới ghi "Đang đi giao" hay báo giao không thành. */
export function isOnTheRoad(status: ShipmentStatus): boolean {
  return status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY";
}

/** Lần giao đã kết thúc: chỉ xem. */
export function isFinished(status: ShipmentStatus): boolean {
  return status === "DELIVERED" || status === "FAILED" || status === "RETURNED" || status === "CANCELLED";
}

/**
 * Nút nào được hiện cho người đang đăng nhập. Chỉ để ẩn nút người dùng chắc chắn không bấm được – luật
 * thật (người phụ trách đơn, đứng đúng kho) do BE quyết định, sai thì BE trả `ORDER_STEP_DENIED`.
 */
export function shipmentActions(shipment?: Pick<ShipmentSummary, "driver"> | null) {
  const user = getCachedUser();
  const role = user?.role;
  const isDriver = shipment?.driver?.id !== undefined && shipment.driver.id === user?.id;
  return {
    canHandOver: allows(role, "shipments", "create"),
    canShip: allows(role, "orders", "ship"),
    canChangeDriver: allows(role, "shipments", "update"),
    canTrack: allows(role, "shipments", "update") || isDriver,
  };
}
