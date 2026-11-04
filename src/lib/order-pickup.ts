import { ORDER_STATUS_LABELS, type FulfillmentType, type OrderStatus } from "@/types/order-flow";

// Đơn khách tới lấy (STORE_PICKUP) dùng chung các trạng thái của hành trình, chỉ khác đường đi: sau khi đóng đơn
// (PACKED) đơn nằm chờ khách ở cửa hàng, thu nốt tiền rồi giao tại quầy là COMPLETED. Không có PICKED_UP, SHIPPING,
// RECEIVED, và không có shipment.

/** Nhãn của trạng thái PACKED với đơn khách tới lấy. */
export const PICKUP_WAITING_LABEL = "Chờ khách lấy";

export function isStorePickup(order: { fulfillmentType: FulfillmentType }): boolean {
  return order.fulfillmentType === "STORE_PICKUP";
}

/** Nhãn trạng thái đơn: PACKED của đơn khách tới lấy là "Chờ khách lấy", còn lại như `ORDER_STATUS_LABELS`. */
export function orderStatusLabel(order: {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}): string {
  if (order.status === "PACKED" && isStorePickup(order)) return PICKUP_WAITING_LABEL;
  return ORDER_STATUS_LABELS[order.status];
}
