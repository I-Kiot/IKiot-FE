import {
  ORDER_STATUS_LABELS,
  type FulfillmentType,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/types/order-flow";

// Đơn khách tới lấy: PACKED chờ khách, thu tiền rồi giao tại quầy là COMPLETED.

/** Nhãn của trạng thái PACKED với đơn khách tới lấy. */
export const PICKUP_WAITING_LABEL = "Chờ khách lấy";

export function isStorePickup(order: { fulfillmentType: FulfillmentType }): boolean {
  return order.fulfillmentType === "STORE_PICKUP";
}

/** Số tiền shop đang giữ của đơn còn huỷ được. */
export function moneyHeld(order: {
  fulfillmentType: FulfillmentType;
  paymentStatus: OrderPaymentStatus;
  grandTotal: number;
  deposit: { amount: number } | null;
}): number {
  if (isStorePickup(order) && order.paymentStatus === "PAID") return order.grandTotal;
  return order.deposit?.amount ?? 0;
}

/** Số còn phải thu để hiển thị. */
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

/** Nhãn trạng thái đơn, PACKED của đơn khách tới lấy là "Chờ khách lấy". */
export function orderStatusLabel(order: {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}): string {
  if (order.status === "PACKED" && isStorePickup(order)) return PICKUP_WAITING_LABEL;
  return ORDER_STATUS_LABELS[order.status];
}
