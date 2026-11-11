// Nhật ký thao tác trên đơn: `GET /orders/:id/events`. Phản chiếu hợp đồng order_events của BE (2026-11-10).
// Backend có thể thêm loại sự kiện / khóa metadata mới: mọi nơi đọc phải chịu được giá trị lạ.
import type { OrderStatus } from "@/types/order-flow";

export const ORDER_EVENT_TYPES = [
  "CREATED",
  "EDITED",
  "CUSTOMIZATION_SET",
  "ASSIGNEE_CHANGED",
  "PRIORITY_CHANGED",
  "PACKED",
  "SHIPMENT_CREATED",
  "PICKED_UP",
  "DRIVER_CHANGED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "DEPOSIT_RECORDED",
  "CASH_COLLECTED",
  "QR_PAID",
  "REMITTANCE_CONFIRMED",
  "REFUNDED",
  "HELD_KEPT",
  "PAID_OFFLINE",
  "PICKUP_COLLECTED",
  "PICKUP_HANDED_OVER",
  "CANCELLED",
  "STATUS_CHANGED",
  "RETURN_CREATED",
  "RETURN_RECEIVED",
  "RETURN_INSPECTED",
  "RETURN_CANCELLED",
  "REPLACEMENT_LINKED",
  "PRODUCTION_REQUESTED",
  "PRODUCTION_RECEIVED",
] as const;
export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];

export const ORDER_EVENT_TYPE_LABELS: Record<OrderEventType, string> = {
  CREATED: "Tạo đơn",
  EDITED: "Sửa đơn",
  CUSTOMIZATION_SET: "Cập nhật thiết kế riêng",
  ASSIGNEE_CHANGED: "Đổi người phụ trách",
  PRIORITY_CHANGED: "Đổi mức ưu tiên",
  PACKED: "Đóng gói",
  SHIPMENT_CREATED: "Bàn giao vận chuyển",
  PICKED_UP: "Shipper đã lấy hàng",
  DRIVER_CHANGED: "Đổi shipper",
  SHIPPED: "Xác nhận đang vận chuyển",
  OUT_FOR_DELIVERY: "Đang đi giao",
  DELIVERED: "Giao hàng thành công",
  DELIVERY_FAILED: "Giao hàng thất bại",
  DEPOSIT_RECORDED: "Nhận tiền cọc",
  CASH_COLLECTED: "Shipper thu tiền mặt",
  QR_PAID: "Nhận chuyển khoản QR",
  REMITTANCE_CONFIRMED: "Xác nhận shipper nộp tiền",
  REFUNDED: "Hoàn tiền cho khách",
  HELD_KEPT: "Giữ lại tiền (thu nhập khác)",
  PAID_OFFLINE: "Thanh toán ngoài SePay",
  PICKUP_COLLECTED: "Thu tiền tại quầy",
  PICKUP_HANDED_OVER: "Giao hàng tại quầy",
  CANCELLED: "Huỷ đơn",
  STATUS_CHANGED: "Đổi trạng thái",
  RETURN_CREATED: "Tạo phiếu hoàn",
  RETURN_RECEIVED: "Hàng hoàn đã về",
  RETURN_INSPECTED: "Kiểm hàng hoàn xong",
  RETURN_CANCELLED: "Huỷ phiếu hoàn",
  REPLACEMENT_LINKED: "Gắn đơn mua lại",
  PRODUCTION_REQUESTED: "Gửi yêu cầu sản xuất",
  PRODUCTION_RECEIVED: "Nhận hàng từ xưởng",
};

export type OrderEventSource = "USER" | "SYSTEM" | "WEBHOOK";

export type OrderEventScalar = string | number | boolean | null;

export type OrderEventRefType = "SHIPMENT" | "ORDER_RETURN" | "PRODUCTION_REQUEST" | "ORDER";

/** Tên trường trong `changes` -> nhãn. Khóa lạ hiện nguyên mã. */
export const ORDER_EVENT_FIELD_LABELS: Record<string, string> = {
  recipientName: "Người nhận",
  recipientPhone: "SĐT nhận",
  deliveryAddress: "Địa chỉ giao",
  requestedDeliveryDate: "Ngày hẹn giao",
  note: "Ghi chú",
  fulfillmentType: "Hình thức nhận hàng",
  customer: "Khách hàng",
  sourceLocation: "Nguồn hàng",
  shippingFee: "Phí giao hàng",
  discountType: "Loại giảm giá",
  discountValue: "Giảm giá",
  depositAmount: "Tiền cọc",
  grandTotal: "Tổng tiền",
  assignee: "Người phụ trách",
  priority: "Mức ưu tiên",
  driver: "Shipper",
};

export interface OrderEventLineRef {
  name: string;
  sku?: string | null;
  quantity?: number;
}

export interface OrderEventLineChange {
  name: string;
  sku?: string | null;
  quantity?: { from: number; to: number };
  unitPrice?: { from: number; to: number };
}

export interface OrderEventMetadata {
  refType?: OrderEventRefType;
  refId?: string;
  refCode?: string | null;
  amount?: number;
  method?: string;
  paymentId?: string;
  paymentReference?: string;
  sepayTransactionId?: string | number;
  refundAmount?: number;
  refundMethod?: string;
  reason?: string;
  note?: string;
  receiverName?: string;
  fulfillmentId?: string;
  packageCount?: number;
  carrierType?: string;
  carrierName?: string;
  trackingCode?: string;
  fromId?: string | null;
  toId?: string | null;
  itemId?: string;
  sku?: string;
  productName?: string;
  firstTime?: boolean;
  deliveryCode?: string;
  quantity?: number;
  grandTotal?: number;
  fulfillmentType?: string;
  paymentMethod?: string;
  good?: number;
  damaged?: number;
  orderSettled?: boolean;
  returnId?: string;
  returnCode?: string;
  shipmentId?: string;
  /** Tiền chuyển khoản về sau khi mã QR đã hết hạn (đơn vẫn đang chờ nên được ghi nhận). */
  lateAfterExpiry?: boolean;
  /** QR_PAID: khách chuyển thiếu so với số mã yêu cầu (`amount` là số thực nhận). */
  partial?: boolean;
  /** QR_PAID chuyển thiếu: số tiền mã QR đã yêu cầu. */
  requested?: number;
  /** QR_PAID: còn phải thu của đơn sau khoản này. */
  due?: number;
  /** QR_PAID: khách trả dư so với số còn phải thu. */
  overpaidBy?: number;
  /** PAID_OFFLINE: tiền thối lại cho khách. */
  change?: number;
  /** Chỉ có ở EDITED. */
  lines?: {
    added?: OrderEventLineRef[];
    removed?: OrderEventLineRef[];
    changed?: OrderEventLineChange[];
  };
}

export interface OrderEvent {
  id: string;
  /** Có thể là loại BE mới chưa có trong `ORDER_EVENT_TYPES`. */
  type: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  source: OrderEventSource;
  actorId: string | null;
  actorName: string | null;
  /** STAFF: tên Role; còn lại: mã systemRole (TENANT_OWNER, ADMIN). */
  actorRole: string | null;
  changes: Record<string, { from: OrderEventScalar; to: OrderEventScalar }> | null;
  metadata: OrderEventMetadata | null;
  occurredAt: string;
}
