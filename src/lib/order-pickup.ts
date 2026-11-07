import {
  ORDER_STATUS_LABELS,
  type FulfillmentType,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/types/order-flow";

// Đơn khách tới lấy (STORE_PICKUP) dùng chung các trạng thái của hành trình, chỉ khác đường đi: sau khi đóng đơn
// (PACKED) đơn nằm chờ khách ở cửa hàng, thu nốt tiền rồi giao tại quầy là COMPLETED. Không có PICKED_UP, SHIPPING,
// RECEIVED, và không có shipment.

/** Nhãn của trạng thái PACKED với đơn khách tới lấy. */
export const PICKUP_WAITING_LABEL = "Chờ khách lấy";

export function isStorePickup(order: { fulfillmentType: FulfillmentType }): boolean {
  return order.fulfillmentType === "STORE_PICKUP";
}

/** Số tiền shop đang giữ của đơn còn huỷ được: tiền cọc, hoặc cả đơn nếu khách tới lấy đã trả đủ tại quầy. Khoản QR chưa về không tính. */
export function moneyHeld(order: {
  fulfillmentType: FulfillmentType;
  paymentStatus: OrderPaymentStatus;
  grandTotal: number;
  deposit: { amount: number } | null;
}): number {
  if (isStorePickup(order) && order.paymentStatus === "PAID") return order.grandTotal;
  return order.deposit?.amount ?? 0;
}

/** Số còn phải thu để hiển thị. `amountDue` của BE là tổng trừ cọc, chưa trừ khoản đã thu tại quầy; đơn đã huỷ thì không còn gì để thu. */
export function amountStillDue(order: {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  paymentStatus: OrderPaymentStatus;
  amountDue: number;
}): number {
  if (order.status === "CANCELLED") return 0;
  if (isStorePickup(order) && order.paymentStatus === "PAID") return 0;
  return order.amountDue;
}

/** Nhãn trạng thái đơn: PACKED của đơn khách tới lấy là "Chờ khách lấy", còn lại như `ORDER_STATUS_LABELS`. */
export function orderStatusLabel(order: {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}): string {
  if (order.status === "PACKED" && isStorePickup(order)) return PICKUP_WAITING_LABEL;
  return ORDER_STATUS_LABELS[order.status];
}
