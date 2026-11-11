import { allows } from "@/components/sidebar/constants/role-permissions";
import { PAYMENT_METHOD_LABELS } from "@/lib/stats-format";
import {
  ORDER_EVENT_TYPE_LABELS,
  type OrderEvent,
  type OrderEventLineChange,
  type OrderEventLineRef,
  type OrderEventMetadata,
  type OrderEventScalar,
  type OrderEventType,
} from "@/types/order-event";
import {
  COLLECTION_METHOD_LABELS,
  FULFILLMENT_TYPE_LABELS,
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/types/order-flow";
import { ROLE_MAP, type UserRole } from "@/types/role";
import { formatPlainDate, formatVND } from "../../shared/order-display";

const EMPTY = "(trống)";
const MONEY_FIELDS = new Set(["shippingFee", "depositAmount", "grandTotal"]);

function lookup(table: Record<string, string>, key: string): string {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
}

export function eventTypeLabel(type: string, meta?: OrderEventMetadata | null): string {
  // Khách chuyển thiếu: cùng loại QR_PAID nhưng không phải đã thu đủ, nói rõ ngay ở tiêu đề.
  if (type === "QR_PAID" && meta?.partial) return "Nhận chuyển khoản QR (chuyển thiếu)";
  return lookup(ORDER_EVENT_TYPE_LABELS as Record<OrderEventType | string, string>, type);
}

/** `reason` của sự kiện REFUNDED. Giá trị lạ (hoặc lý do tự do của sự kiện khác) giữ nguyên. */
const REFUND_REASON_LABELS: Record<string, string> = {
  RETURN_INSPECTION: "Kiểm hàng hoàn",
  POS_RETURN: "Trả hàng tại quầy",
  EXCESS_PAYMENT: "Hoàn tiền khách trả dư",
  HELD_DECISION: "Quyết định tiền giữ treo",
};

export function statusLabel(status: string): string {
  return lookup(ORDER_STATUS_LABELS, status);
}

/** Giá trị một dòng `changes`: tiền thành VND, ngày thành dd/MM/yyyy, mã thành nhãn; còn lại giữ nguyên. */
export function formatChangeValue(field: string, value: OrderEventScalar | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (MONEY_FIELDS.has(field) && typeof value === "number") return formatVND(value);
  if (field === "discountValue" && typeof value === "number") return value.toLocaleString("vi-VN");
  if (field === "requestedDeliveryDate" && typeof value === "string") return formatPlainDate(value);
  if (field === "priority") return lookup(ORDER_PRIORITY_LABELS, String(value));
  if (field === "fulfillmentType") return lookup(FULFILLMENT_TYPE_LABELS, String(value));
  return String(value);
}

export function actorLabel(event: OrderEvent): string {
  if (event.source === "WEBHOOK") return "SePay (tự động)";
  if (event.source === "SYSTEM") return "Hệ thống";
  const name = event.actorName ?? "Người dùng đã xoá";
  if (!event.actorRole) return name;
  const role = lookup(ROLE_MAP as Record<UserRole | string, string>, event.actorRole);
  return `${name} · ${role}`;
}

export function methodLabel(method: string | undefined): string | null {
  if (!method) return null;
  return lookup({ ...PAYMENT_METHOD_LABELS, ...COLLECTION_METHOD_LABELS }, method);
}

export function statusTransition(event: OrderEvent): string | null {
  const { fromStatus: from, toStatus: to } = event;
  if (!from && !to) return null;
  if (!from) return statusLabel(to as OrderStatus);
  if (!to) return statusLabel(from);
  return `${statusLabel(from)} → ${statusLabel(to)}`;
}

export type RefLink = { href: string | null; label: string };

/** Chứng từ liên quan. `href` null khi người xem không có quyền mở trang đích (hiện chữ thường). */
export function refLink(meta: OrderEventMetadata | null, role: string | null | undefined): RefLink | null {
  if (!meta?.refType || !meta.refId) return null;
  const code = meta.refCode ?? "";
  const search = encodeURIComponent(code);
  switch (meta.refType) {
    case "SHIPMENT":
      return { href: `/shipments/${meta.refId}`, label: `Lần giao ${code}`.trim() };
    case "ORDER_RETURN":
      return {
        href: code && allows(role, "returns", "read") ? `/order-returns?search=${search}` : null,
        label: `Phiếu hoàn ${code}`.trim(),
      };
    case "PRODUCTION_REQUEST":
      return {
        href:
          code && allows(role, "production_requests", "read")
            ? `/exchange/imports?source=WORKSHOP&search=${search}`
            : null,
        label: `YCSX ${code}`.trim(),
      };
    case "ORDER":
      return {
        href: allows(role, "orders", "read") ? `/sales/orders/${meta.refId}` : null,
        label: `Đơn ${code}`.trim(),
      };
    default:
      return null;
  }
}

function lineName(line: { name: string; sku?: string | null }): string {
  return line.sku ? `${line.name} (${line.sku})` : line.name;
}

/** Các dòng mô tả thay đổi dòng hàng của EDITED. */
export function lineChangeTexts(lines: OrderEventMetadata["lines"]): string[] {
  if (!lines) return [];
  const out: string[] = [];
  (lines.added ?? []).forEach((l: OrderEventLineRef) =>
    out.push(`Thêm: ${lineName(l)}${l.quantity != null ? ` ×${l.quantity}` : ""}`),
  );
  (lines.removed ?? []).forEach((l: OrderEventLineRef) => out.push(`Bỏ: ${lineName(l)}`));
  (lines.changed ?? []).forEach((l: OrderEventLineChange) => {
    const parts: string[] = [];
    if (l.quantity) parts.push(`SL ${l.quantity.from} → ${l.quantity.to}`);
    if (l.unitPrice) parts.push(`Giá ${formatVND(l.unitPrice.from)} → ${formatVND(l.unitPrice.to)}`);
    out.push(`${lineName(l)}: ${parts.join(" / ") || "đổi thông tin"}`);
  });
  return out;
}

/** Tóm tắt metadata (tiền, lý do, ghi chú...) thành các dòng ngắn. */
export function metadataTexts(meta: OrderEventMetadata | null): string[] {
  if (!meta) return [];
  const out: string[] = [];
  const method = methodLabel(meta.method);
  if (typeof meta.amount === "number") {
    out.push(`Số tiền: ${formatVND(meta.amount)}${method ? ` (${method})` : ""}`);
  } else if (method) {
    out.push(`Hình thức: ${method}`);
  }
  if (typeof meta.refundAmount === "number") {
    const refund = methodLabel(meta.refundMethod);
    out.push(`Hoàn tiền: ${formatVND(meta.refundAmount)}${refund ? ` (${refund})` : ""}`);
  }
  if (meta.receiverName) out.push(`Người nhận: ${meta.receiverName}`);
  if (meta.carrierName) out.push(`Đơn vị vận chuyển: ${meta.carrierName}`);
  if (meta.trackingCode) out.push(`Mã vận đơn: ${meta.trackingCode}`);
  if (typeof meta.packageCount === "number") out.push(`Số kiện: ${meta.packageCount}`);
  if (meta.productName) out.push(`Sản phẩm: ${meta.productName}${meta.sku ? ` (${meta.sku})` : ""}`);
  if (typeof meta.quantity === "number") out.push(`Số lượng: ${meta.quantity}`);
  if (typeof meta.good === "number" || typeof meta.damaged === "number") {
    out.push(`Hàng tốt: ${meta.good ?? 0}, hàng hỏng: ${meta.damaged ?? 0}`);
  }
  // Tiền thối chỉ có ở PAID_OFFLINE (khách đưa dư so với số còn phải thu).
  if (typeof meta.change === "number" && meta.change > 0) out.push(`Tiền thối lại: ${formatVND(meta.change)}`);
  if (meta.partial && typeof meta.requested === "number") {
    out.push(`Mã QR yêu cầu ${formatVND(meta.requested)}, khách chỉ chuyển ${formatVND(meta.amount ?? 0)}`);
  }
  if (typeof meta.due === "number" && meta.due > 0) out.push(`Còn phải thu: ${formatVND(meta.due)}`);
  if (typeof meta.overpaidBy === "number" && meta.overpaidBy > 0) {
    out.push(`Khách trả dư ${formatVND(meta.overpaidBy)} - cần hoàn lại phần dư`);
  }
  if (meta.lateAfterExpiry) out.push("Tiền về sau khi mã QR hết hạn");
  if (meta.orderSettled === false && !(typeof meta.due === "number" && meta.due > 0)) {
    out.push("Đơn chưa được tất toán");
  }
  if (meta.reason) out.push(`Lý do: ${Object.prototype.hasOwnProperty.call(REFUND_REASON_LABELS, meta.reason) ? REFUND_REASON_LABELS[meta.reason] : meta.reason}`);
  if (meta.note) out.push(`Ghi chú: ${meta.note}`);
  return out;
}
