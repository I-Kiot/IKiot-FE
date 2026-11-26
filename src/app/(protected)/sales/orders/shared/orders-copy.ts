import { amountStillDue } from "@/lib/order-pickup";
import type { TableCell } from "@/lib/clipboard-table";
import { FULFILLMENT_TYPE_LABELS, type OrderListItem } from "@/types/order-flow";
import {
  formatDateTime,
  formatPlainDate,
  orderStatusDisplay,
  priorityDisplay,
} from "./order-display";

/** Thứ tự cột khi chép đơn. */
export const ORDER_COPY_COLUMNS = [
  "Mã đơn",
  "Nơi bán",
  "Khách hàng",
  "SĐT khách",
  "Trạng thái",
  "Hình thức giao",
  "Ưu tiên",
  "Phụ trách",
  "Người giao hàng",
  "Hẹn giao",
  "Sản phẩm",
  "Số lượng",
  "Địa chỉ nhận hàng",
  "Tổng tiền",
  "Tiền cọc",
  "Còn thu",
  "Ngày tạo",
  "Ghi chú",
] as const;

const dash = (value: string) => (value === "-" ? "" : value);

export function orderCopyRow(order: OrderListItem): TableCell[] {
  const products = order.items
    .map(
      (item) =>
        `${item.productName ?? item.sku ?? ""}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity}`,
    )
    // Mỗi sản phẩm một dòng trong cùng ô (như Alt+Enter trong Excel).
    .join("\n");
  return [
    order.code,
    order.branch?.name ?? "",
    order.customer?.name ?? "",
    order.customer?.phone ?? "",
    orderStatusDisplay(order.status, order.latestShipmentStatus, order.fulfillmentType).label,
    FULFILLMENT_TYPE_LABELS[order.fulfillmentType] ?? order.fulfillmentType,
    priorityDisplay(order.priority).label,
    order.assignee?.name ?? "",
    order.driver?.name ?? "",
    dash(formatPlainDate(order.requestedDeliveryDate)),
    products,
    order.items.reduce((sum, item) => sum + item.quantity, 0),
    order.deliveryAddress ?? "",
    order.grandTotal,
    order.deposit?.amount ?? 0,
    amountStillDue(order),
    dash(formatDateTime(order.createdAt)),
    order.note ?? "",
  ];
}
