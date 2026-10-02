// [Domain – Types] Hành trình đơn hàng (P0-6, 2026-10-02).
//
// Mirror of Ikiot_BE/docs/api-contract-order-flow.md and the BE constants in
// src/common/constants/*-status.ts. Owned by Phase 0: change the contract first, then this
// file - never one without the other.

// ─── Shared ─────────────────────────────────────────────────────────────────

export interface UserRef {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface LocationRef {
  id: string;
  name: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PageQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Statuses (same strings as the BE constants) ────────────────────────────

export const ORDER_STATUSES = [
  "DRAFT",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "READY_TO_PACK",
  "PACKED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  /** Legacy till state (awaiting SePay) until A-2 retires it. */
  "PENDING",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Nháp",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  READY_TO_PACK: "Chờ đóng hàng",
  PACKED: "Chờ giao hàng",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn",
  PENDING: "Chờ thanh toán",
};

export const ORDER_ITEM_STATUSES = [
  "PENDING",
  "WAITING_STOCK",
  "READY",
  "PACKED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  PENDING: "Chờ xử lý",
  WAITING_STOCK: "Chờ hàng",
  READY: "Sẵn sàng",
  PACKED: "Đã đóng",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn",
};

export type OrderLineType = "PRODUCT" | "COMBO" | "COMBO_COMPONENT" | "SERVICE";
export type OrderChannel = "MANUAL" | "SHOPEE";
export type FulfillmentType = "TAKEAWAY" | "STORE_PICKUP" | "HOME_DELIVERY";

export const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  TAKEAWAY: "Mang về",
  STORE_PICKUP: "Nhận tại cửa hàng",
  HOME_DELIVERY: "Giao tận nơi",
};

export type OrderPaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type ProductionRequestStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export const PRODUCTION_REQUEST_STATUS_LABELS: Record<ProductionRequestStatus, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi xưởng",
  PARTIALLY_RECEIVED: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

export type FulfillmentStatus =
  | "PENDING"
  | "PICKING"
  | "PICKED"
  | "PACKING"
  | "PACKED"
  | "HANDED_OVER"
  | "EXCEPTION"
  | "CANCELLED";

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  PENDING: "Chờ lấy hàng",
  PICKING: "Đang lấy hàng",
  PICKED: "Đã lấy hàng",
  PACKING: "Đang đóng gói",
  PACKED: "Đã đóng gói",
  HANDED_OVER: "Đã bàn giao",
  EXCEPTION: "Có sự cố",
  CANCELLED: "Đã huỷ",
};

export type ShipmentStatus =
  | "CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  CREATED: "Mới tạo",
  PICKED_UP: "Đã lấy hàng",
  IN_TRANSIT: "Đang vận chuyển",
  OUT_FOR_DELIVERY: "Đang giao",
  DELIVERED: "Đã giao",
  FAILED: "Giao thất bại",
  RETURNED: "Đã hoàn",
  CANCELLED: "Đã huỷ",
};

export type CarrierType = "INTERNAL" | "EXTERNAL";
export type OrderReturnStatus = "PENDING" | "INSPECTED" | "CANCELLED";
export type OrderReturnReason = "CUSTOMER_RETURN" | "DELIVERY_FAILED";
export type ReturnCondition = "GOOD" | "DAMAGED";
export type SupplierType = "GOODS" | "WORKSHOP";
export type ImportSource = "SUPPLIER" | "WORKSHOP";

// ─── Orders (track A BE / track D FE) ───────────────────────────────────────

export interface OrderItemSpec {
  name: string;
  value: string;
  unit?: string | null;
}

export interface OrderItemCustomization {
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  material?: string | null;
  color?: string | null;
  fabricCode?: string | null;
  note?: string | null;
  attachmentUrls: string[];
  specs: OrderItemSpec[];
}

export interface OrderLine {
  id: string;
  productItemId: string;
  productName: string | null;
  sku: string | null;
  variantLabel: string | null;
  status: OrderItemStatus;
  lineType: OrderLineType;
  parentItemId: string | null;
  quantity: number;
  listUnitPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  /** Σ ACTIVE + CONSUMED holds. */
  heldQuantity: number;
  returnedQuantity: number;
  sourceLocation: LocationRef | null;
  isCustom: boolean;
  customization: OrderItemCustomization | null;
}

export interface OrderListItem {
  id: string;
  code?: string | null;
  status: OrderStatus;
  channel: OrderChannel;
  branch: LocationRef;
  customer: { id: string; name: string; phone: string | null };
  assignee: UserRef | null;
  createdBy: UserRef | null;
  confirmedBy: UserRef | null;
  confirmedAt: string | null;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  shippingFee: number;
  channelFee: number;
  vatTotal: number;
  discountType: "ORDER" | "PROMOTION" | null;
  discountValue: number;
  grandTotal: number;
  depositRequired: number | null;
  paymentStatus: OrderPaymentStatus;
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
  requestedDeliveryDate: string | null;
  shipByDate: string | null;
  channelOrderRef: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface OrderDetail extends OrderListItem {
  items: OrderLine[];
  fulfillments: { id: string; status: FulfillmentStatus; locationId: string }[];
  shipments: {
    id: string;
    status: ShipmentStatus;
    carrierType: CarrierType;
    trackingCode: string | null;
  }[];
  returns: { id: string; code: string; status: OrderReturnStatus }[];
}

export interface OrderJourneyQuery extends PageQuery {
  status?: OrderStatus;
  channel?: OrderChannel;
  assigneeId?: string;
  branchId?: string;
  fulfillmentType?: FulfillmentType;
  from?: string;
  to?: string;
}

export interface CreateOrderLinePayload {
  productItemId: string;
  quantity: number;
  /** Agreed price; omit for the catalogue price. */
  unitPrice?: number;
  discountAmount?: number;
  sourceLocationId?: string;
  /** Present → a custom (made-to-order) line. */
  customization?: OrderItemCustomization;
}

export interface CreateOrderJourneyPayload {
  branchId: string;
  customerId?: string;
  customer?: { name: string; phone?: string; address?: string };
  /** Required unless `asDraft`. */
  assigneeId?: string;
  fulfillmentType: FulfillmentType;
  items: CreateOrderLinePayload[];
  shippingFee?: number;
  discountType?: "ORDER";
  discountValue?: number;
  appliedPromotions?: { promotionId: string }[];
  depositRequired?: number;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
  note?: string;
  asDraft?: boolean;
  payment?: { method: "CASH" | "BANK_TRANSFER" | "SEPAY"; customerPay?: number };
}

export type UpdateDraftOrderPayload = Omit<CreateOrderJourneyPayload, "asDraft">;

export interface ConfirmOrderPayload {
  assigneeId?: string;
  sourceLocationId?: string;
  lines?: { orderItemId: string; sourceLocationId: string }[];
}

// ─── Production requests & imports (track B) ────────────────────────────────

export interface ProductionRequestLine {
  id: string;
  productItemId: string;
  sku: string | null;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  note: string | null;
  orderItem: { id: string; orderId: string; orderCode: string | null; isCustom: boolean } | null;
}

export interface ProductionRequest {
  id: string;
  code: string;
  status: ProductionRequestStatus;
  supplier: { id: string; supplierName: string; phoneNumber: string | null };
  location: LocationRef & { type: "BRANCH" | "WAREHOUSE" };
  expectedReadyDate: string | null;
  sentAt: string | null;
  note: string | null;
  createdBy: UserRef | null;
  statusUpdatedBy: UserRef | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProductionRequestLine[];
}

export interface ProductionRequestQuery extends PageQuery {
  status?: ProductionRequestStatus;
  supplierId?: string;
  locationId?: string;
}

export interface ProductionRequestLinePayload {
  productItemId: string;
  quantity: number;
  orderItemId?: string;
  note?: string;
}

export interface CreateProductionRequestPayload {
  supplierId: string;
  locationId: string;
  expectedReadyDate?: string;
  note?: string;
  items: ProductionRequestLinePayload[];
}

export interface UpdateProductionRequestStatusPayload {
  status: "SENT" | "COMPLETED" | "CANCELLED";
  note?: string;
}

export interface Shortage {
  locationId: string;
  locationName: string;
  productItemId: string;
  sku: string | null;
  productName: string;
  available: number;
  waitingQuantity: number;
  onOrderQuantity: number;
  shortQuantity: number;
}

// ─── Fulfillment & delivery (track C) ───────────────────────────────────────

export interface FulfillmentLine {
  id: string;
  orderItemId: string;
  productName: string | null;
  sku: string | null;
  quantity: number;
  qtyPicked: number;
  qtyPacked: number;
  packagesRequired: number;
}

export interface FulfillmentPackage {
  id: string;
  code: string;
  productPackageId: string | null;
  weightKg: number | null;
  photoUrls: string[];
  packedBy: UserRef | null;
  packedAt: string;
}

export interface Fulfillment {
  id: string;
  status: FulfillmentStatus;
  order: {
    id: string;
    code: string | null;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    customerName: string;
    assigneeId: string | null;
  };
  location: LocationRef;
  assignee: UserRef | null;
  verifiedBy: UserRef | null;
  verifiedAt: string | null;
  dueDate: string | null;
  pickStartedAt: string | null;
  pickedAt: string | null;
  packStartedAt: string | null;
  packedAt: string | null;
  handedOverAt: string | null;
  exceptionNote: string | null;
  createdAt: string;
  items: FulfillmentLine[];
  packages: FulfillmentPackage[];
}

export interface FulfillmentQuery extends PageQuery {
  status?: FulfillmentStatus;
  locationId?: string;
  assigneeId?: string;
}

export interface UpdateFulfillmentItemsPayload {
  items: { orderItemId: string; qtyPicked?: number; qtyPacked?: number; pickedFromId?: string }[];
}

export interface AddFulfillmentPackagePayload {
  productPackageId?: string;
  weightKg?: number;
  photoUrls: string[];
}

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  source: "MANUAL" | "CARRIER";
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  createdBy: UserRef | null;
  occurredAt: string;
}

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  carrierType: CarrierType;
  carrierName: string | null;
  trackingCode: string | null;
  order: { id: string; code: string | null; customerName: string };
  fulfillmentId: string;
  driver: UserRef | null;
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
  scheduledDate: string | null;
  scheduledSlot: string | null;
  expectedDeliveryAt: string | null;
  deliveredAt: string | null;
  requiresInstallation: boolean;
  installedAt: string | null;
  proofPhotoUrls: string[];
  shippingCost: number | null;
  note: string | null;
  createdAt: string;
  events: ShipmentEvent[];
}

export interface ShipmentQuery extends PageQuery {
  status?: ShipmentStatus;
  carrierType?: CarrierType;
  driverId?: string;
  from?: string;
  to?: string;
}

export interface CreateShipmentPayload {
  fulfillmentId: string;
  carrierType: CarrierType;
  carrierName?: string;
  trackingCode?: string;
  driverId?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  expectedDeliveryAt?: string;
  requiresInstallation?: boolean;
  shippingCost?: number;
  note?: string;
}

export interface ShipmentEventPayload {
  status: ShipmentStatus;
  note?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliverShipmentPayload {
  proofPhotoUrls?: string[];
  note?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Returns (track D) ──────────────────────────────────────────────────────

export interface OrderReturnLine {
  id: string;
  orderItemId: string;
  productName: string | null;
  sku: string | null;
  quantity: number;
  condition: ReturnCondition | null;
  location: LocationRef | null;
  note: string | null;
}

export interface OrderReturn {
  id: string;
  code: string;
  status: OrderReturnStatus;
  reason: OrderReturnReason;
  order: { id: string; code: string | null; customerName: string; assigneeId: string | null };
  shipmentId: string | null;
  note: string | null;
  createdBy: UserRef | null;
  inspectedBy: UserRef | null;
  inspectedAt: string | null;
  createdAt: string;
  items: OrderReturnLine[];
}

export interface OrderReturnQuery extends PageQuery {
  status?: OrderReturnStatus;
  orderId?: string;
}

export interface CreateOrderReturnPayload {
  orderId: string;
  reason: OrderReturnReason;
  shipmentId?: string;
  note?: string;
  items: { orderItemId: string; quantity: number; note?: string }[];
}

export interface InspectOrderReturnPayload {
  items: { orderItemId: string; condition: ReturnCondition; locationId?: string }[];
}
