/**
 * Hợp đồng của feed thay đổi thời gian thực `entity:changed`, phản chiếu thủ công từ BE
 * `src/common/constants/change-feed.ts` + `change-feed.types.ts`. BE chỉ thêm, không đổi tên: thêm giá trị ở BE thì thêm ở đây.
 * Chỉ rẽ nhánh theo `action`, không bao giờ theo chữ của `summary` (câu tiếng Việt do BE dựng, hiện nguyên văn).
 */
export const ENTITY_CHANGED_EVENT = "entity:changed";

/** Header gửi kèm mỗi request để BE không phát lại sự kiện cho chính tab gây ra thay đổi. */
export const SOCKET_ID_HEADER = "X-Socket-Id";

export const CHANGE_RESOURCES = {
  ORDERS: "orders",
  FULFILLMENTS: "fulfillments",
  SHIPMENTS: "shipments",
  INVENTORIES: "inventories",
  PRODUCTION_REQUESTS: "production-requests",
  PRODUCTION_DELIVERIES: "production-deliveries",
  STOCK_MOVEMENTS: "stock-movements",
  ORDER_RETURNS: "order-returns",
} as const;

export type ChangeResource = (typeof CHANGE_RESOURCES)[keyof typeof CHANGE_RESOURCES];

export type ChangeSource = "USER" | "SYSTEM" | "WEBHOOK";

export type ChangeAction =
  | "ORDER_CREATED"
  | "ORDER_POS_CREATED"
  | "ORDER_CANCELLED"
  | "ORDER_EDITED"
  | "ORDER_ASSIGNEE_CHANGED"
  | "ORDER_PRIORITY_CHANGED"
  | "ORDER_CUSTOMIZED"
  | "ORDER_REMITTANCE_CONFIRMED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_PICKUP_COLLECTED"
  | "ORDER_PICKUP_HANDED_OVER"
  | "ORDER_HELD_SETTLED"
  | "ORDER_EXCESS_REFUNDED"
  | "ORDER_PAID_OFFLINE"
  | "ORDER_QR_PAID"
  | "ORDER_QR_PARTIALLY_PAID"
  | "ORDER_QR_EXPIRED_CANCELLED"
  | "PAYMENT_QR_EXPIRED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_PICKED_UP"
  | "SHIPMENT_EVENT_ADDED"
  | "SHIPMENT_DELIVERED"
  | "SHIPMENT_CASH_COLLECTED"
  | "SHIPMENT_QR_REISSUED"
  | "SHIPMENT_FAILED"
  | "SHIPMENT_DRIVER_CHANGED"
  | "PRODUCTION_REQUEST_CREATED"
  | "PRODUCTION_REQUEST_EDITED"
  | "PRODUCTION_REQUEST_ITEM_ADDED"
  | "PRODUCTION_REQUEST_STATUS_CHANGED"
  | "PRODUCTION_REQUEST_DELETED"
  | "PRODUCTION_RECEIVED"
  | "PRODUCTION_REQUEST_ACCEPTED"
  | "PRODUCTION_REQUEST_DECLINED"
  | "PRODUCTION_DELIVERY_CREATED"
  | "PRODUCTION_DELIVERY_CANCELLED"
  | "PRODUCTION_DELIVERY_RECEIVED"
  | "PRODUCTION_DELIVERY_REJECTED"
  | "STOCK_MOVEMENT_CREATED"
  | "STOCK_MOVEMENT_EDITED"
  | "STOCK_MOVEMENT_OPENED"
  | "STOCK_MOVEMENT_CLOSED"
  | "STOCK_MOVEMENT_SHIPPED"
  | "STOCK_MOVEMENT_RECEIVED"
  | "STOCK_MOVEMENT_ADJUST_APPROVED"
  | "STOCK_MOVEMENT_CANCELLED"
  // Hàng hỏng trên một dòng tồn (2026-11-26)
  | "INVENTORY_MARKED_DAMAGED"
  | "INVENTORY_DAMAGED_REPAIRED"
  | "INVENTORY_DAMAGED_WRITTEN_OFF"
  | "RETURN_CREATED"
  | "RETURN_FAILED_DELIVERY_CONFIRMED"
  | "RETURN_RECEIVED"
  | "RETURN_INSPECTED"
  | "RETURN_CANCELLED"
  | "RETURN_REPLACEMENT_LINKED";

export interface EntityChangedEvent {
  /** Một cho mỗi request / lần phát; dùng để hai màn hình không hiện hai toast cho cùng một sự kiện. */
  eventId: string;
  action: ChangeAction;
  /** Chủ thể đứng đầu. `ids: []` = có dòng đổi nhưng không biết dòng nào. */
  changes: { resource: ChangeResource; ids: string[] }[];
  /** Null chỉ với sự kiện gộp (nhiều đơn một lúc). */
  subject: { resource: ChangeResource; id: string; code: string | null } | null;
  actor: { id: string | null; name: string };
  source: ChangeSource;
  /** Câu tiếng Việt hoàn chỉnh, hiện nguyên văn. Chỉ có tên người làm, động từ và mã chứng từ. */
  summary: string;
  /** True = chỉ tải lại dữ liệu, không toast. */
  quiet: boolean;
  at: string;
}
